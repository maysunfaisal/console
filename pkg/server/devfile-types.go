package server

import (
	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

type formData struct {
	Name    string  `json:"name"`
	Git     git     `json:"git"`
	Devfile devfile `json:"devfile"`
}

type devfileResources struct {
	ImageStream imagev1.ImageStream `json:"imageStream"`
	// This can be enhanced to include BuildResource Type that includes all possible types of build objects(eg buildConfig, build pod etc)
	BuildResource buildv1.BuildConfig `json:"buildResource"`
	// This can be enhanced to include Deploy Resource Type that includes all possible types of deployment objects(eg deployment, deploymentConfig, helm chart etc)
	DeployResource appsv1.Deployment `json:"deployResource"`
	Service        corev1.Service    `json:"service"`
	Route          routev1.Route     `json:"route"`
}

type git struct {
	URL string `json:"url"`
	Ref string `json:"ref"`
	Dir string `json:"dir"`
}

type devfile struct {
	DevfileContent string `json:"devfileContent"`
	DevfilePath    string `json:"devfilePath"`
}
