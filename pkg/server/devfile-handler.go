package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	"github.com/openshift/console/pkg/serverutils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

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
	// devfileContentBytes := []byte(data.Devfile.DevfileContent)
	devfileObj, err = devfilePkg.ParseAndValidate(data.Devfile.DevfilePath)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse devfile: %v", err)})
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
		ImageStream:    getImageStream(),
		BuildResource:  getBuildResource(),
		DeployResource: deploymentResource,
		Service:        service,
		Route:          getRoute(),
	}

	devfileResourcesJSON, err := json.Marshal(devfileResources)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to marshall console devfile resources: %v", err)})
	}

	w.Header().Set("Content-Type", "application/json")
	serverutils.SendResponse(w, http.StatusOK, struct {
		DevfileResources string `json:"devfileResources"`
	}{
		DevfileResources: string(devfileResourcesJSON),
	})
}

func getImageStream() imagev1.ImageStream {

	imageStreamParams := generator.ImageStreamParams{
		TypeMeta:   generator.GetTypeMeta("ImageStream", "image.openshift.io/v1"),
		ObjectMeta: generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
	}
	imageStream := generator.GetImageStream(imageStreamParams)
	return imageStream
}

func getBuildResource() buildv1.BuildConfig {

	buildConfigParams := generator.BuildConfigParams{
		TypeMeta:   generator.GetTypeMeta("BuildConfig", "build.openshift.io/v1"),
		ObjectMeta: generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		BuildConfigSpecParams: generator.BuildConfigSpecParams{
			ImageStreamTagName: data.Name + ":latest", // TODO update as per proposal
			GitRef:             data.Git.Ref,
			GitURL:             data.Git.URL,
			BuildStrategy:      generator.GetDockerBuildStrategy(dockerfilePath, data.Build.Env), // TODO use the path from the devfile
		},
	}

	buildConfig := generator.GetBuildConfig(buildConfigParams)

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

func getRoute() routev1.Route {

	routeParams := generator.RouteParams{
		TypeMeta:   generator.GetTypeMeta("Route", "route.openshift.io/v1"),
		ObjectMeta: generator.GetObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		RouteSpecParams: generator.RouteSpecParams{
			ServiceName: data.Name,
			PortNumber:  intstr.FromInt(9999), //update, need a way to get it from devfile endpoints but generators does not
			Path:        data.RouteSpec.Path,
		},
	}

	route := generator.GetRoute(routeParams)

	// route := routev1.Route{
	// 	TypeMeta:   createTypeMeta("Route", "route.openshift.io/v1"),
	// 	ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
	// 	Spec: routev1.RouteSpec{
	// 		To: routev1.RouteTargetReference{
	// 			Kind: "Service",
	// 			Name: data.Name,
	// 		},
	// 		Host: data.RouteSpec.Hostname,
	// 		Path: data.RouteSpec.Path,
	// 		Port: &routev1.RoutePort{
	// 			TargetPort: intstr.IntOrString{
	// 				Type:   intstr.String,
	// 				IntVal: int32(0),
	// 				StrVal: fmt.Sprintf("%d-%s", data.Image.Ports[0].ContainerPort, strings.ToLower(fmt.Sprintf("%s", data.Image.Ports[0].Protocol))),
	// 			},
	// 		},
	// 		WildcardPolicy: routev1.WildcardPolicyNone,
	// 	},
	// }

	return *route
}
