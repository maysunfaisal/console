package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	"github.com/openshift/console/pkg/serverutils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	devfilev1 "github.com/devfile/api/pkg/apis/workspaces/v1alpha2"
	devfilePkg "github.com/devfile/library/pkg/devfile"
	"github.com/devfile/library/pkg/devfile/generator"
	"github.com/devfile/library/pkg/devfile/parser"
)

const (
	dockerfilePath = "Dockerfile"
)

var (
	data       formData
	devfileObj parser.DevfileObj
)

func (s *Server) devfileHandler(w http.ResponseWriter, r *http.Request) {
	_ = json.NewDecoder(r.Body).Decode(&data)

	var err error

	// Get devfile contents and parse them using a library call in the future
	devfileContentBytes := []byte(data.Devfile.DevfileContent)
	devfileObj, err = devfilePkg.ParseFromDataAndValidate(devfileContentBytes)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse devfile: %v", err)})
	}

	containerComponents := devfileObj.Data.GetDevfileContainerComponents() //TODO: filter thru Console attribute, right now if there is more than one component container err out
	if len(containerComponents) > 1 {
		log.Printf(">>> MJF more than 1 component present %+v\n\n", len(containerComponents))
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Console Devfile Import Dev Preview, supports only one component container")})
	}

	deploymentResource, err := getDeployResource()
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to get deployment resource for the devfile: %v", err)})
	}

	service, err := getService()
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to get service for the devfile: %v", err)})
	}

	devfileResources := devfileResources{ // Replace calls with call to library functions, these can also be made arrays if expecting multiple objects
		ImageStream:    getImageStream(containerComponents),
		BuildResource:  getBuildResource(containerComponents),
		DeployResource: deploymentResource,
		Service:        service,
		Route:          getRoutes(containerComponents),
	}

	devfileResourcesJSON, err := json.Marshal(devfileResources)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to marshall console devfile resources: %v", err)})
	}

	log.Printf(">>> MJF devfileResourcesJSON is %+v\n\n", devfileResourcesJSON)

	w.Header().Set("Content-Type", "application/json")
	serverutils.SendResponse(w, http.StatusOK, struct {
		DevfileResources string `json:"devfileResources"`
	}{
		DevfileResources: string(devfileResourcesJSON),
	})
}

func getImageStream(containerComponents []devfilev1.Component) imagev1.ImageStream {

	imageStreamParams := generator.ImageStreamParams{
		TypeMeta:   generator.GetTypeMeta("ImageStream", "image.openshift.io/v1"),
		ObjectMeta: generator.GetObjectMeta(containerComponents[0].Container.Image, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
	}
	imageStream := generator.GetImageStream(imageStreamParams)
	return imageStream
}

func getBuildResource(containerComponents []devfilev1.Component) buildv1.BuildConfig {

	buildConfigParams := generator.BuildConfigParams{
		TypeMeta:   generator.GetTypeMeta("BuildConfig", "build.openshift.io/v1"),
		ObjectMeta: generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		BuildConfigSpecParams: generator.BuildConfigSpecParams{
			ImageStreamTagName: containerComponents[0].Container.Image, // TODO update as per proposal i.e.; use the image mentioned in the devfile and push build to it
			GitRef:             data.Git.Ref,
			GitURL:             data.Git.URL,
			BuildStrategy:      generator.GetDockerBuildStrategy(dockerfilePath, data.Build.Env), // TODO use the Dockerfile path from the devfile instead of assuming
		},
	}

	buildConfig := generator.GetBuildConfig(buildConfigParams)
	buildConfig.Spec.CommonSpec.Source.ContextDir = data.Git.Dir

	return *buildConfig
}

func getDeployResource() (appsv1.Deployment, error) {

	containers, err := generator.GetContainers(devfileObj)
	if err != nil {
		return appsv1.Deployment{}, err
	}

	deployParams := generator.DeploymentParams{
		TypeMeta:          generator.GetTypeMeta("Deployment", "apps/v1"),
		ObjectMeta:        generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		Containers:        containers,
		PodSelectorLabels: map[string]string{"app": data.Name},
	}

	deployment := generator.GetDeployment(deployParams)

	deployment.Spec.Template.ObjectMeta.Labels = addmap(data.UserLabls, data.PodLabels) // Update pod labels since service selector labels are data.PodLabels

	return *deployment, nil
}

func getService() (corev1.Service, error) {

	serviceParams := generator.ServiceParams{
		TypeMeta:       generator.GetTypeMeta("Service", "v1"),
		ObjectMeta:     generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		SelectorLabels: data.PodLabels,
	}

	service, err := generator.GetService(devfileObj, serviceParams)
	if err != nil {
		return corev1.Service{}, err
	}

	return *service, nil
}

func getRoutes(containerComponents []devfilev1.Component) routev1.Route {

	var routes []routev1.Route

	for _, comp := range containerComponents {
		for _, endpoint := range comp.Container.Endpoints {
			if endpoint.Exposure == devfilev1.NoneEndpointExposure || endpoint.Exposure == devfilev1.InternalEndpointExposure {
				continue
			}
			secure := false
			if endpoint.Secure || endpoint.Protocol == "https" || endpoint.Protocol == "wss" {
				secure = true
			}
			path := "/"
			if endpoint.Path != "" {
				path = endpoint.Path
			}

			routeParams := generator.RouteParams{
				TypeMeta:   generator.GetTypeMeta("Route", "route.openshift.io/v1"),
				ObjectMeta: generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
				RouteSpecParams: generator.RouteSpecParams{
					ServiceName: data.Name,
					PortNumber:  intstr.FromInt(endpoint.TargetPort),
					Path:        path,
					Secure:      secure,
				},
			}

			route := generator.GetRoute(routeParams)
			routes = append(routes, *route)
		}
	}

	return routes[0]
}
