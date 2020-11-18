export default {
  devfileResources: {
    imageStream: {
      kind: 'ImageStream',
      apiVersion: 'image.openshift.io/v1',
      metadata: {
        name: 'maysun',
        namespace: 'mjf',
        creationTimestamp: null,
        labels: {
          app: 'node-bulletin-board',
          'app.kubernetes.io/component': 'node-bulletin-board',
          'app.kubernetes.io/instance': 'node-bulletin-board',
          'app.kubernetes.io/part-of': 'node-bulletin-board-app',
          deploymentconfig: 'node-bulletin-board',
        },
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
          isFromDevfile: 'true',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        lookupPolicy: {
          local: false,
        },
      },
      status: {
        dockerImageRepository: '',
      },
    },
    buildResource: {
      kind: 'BuildConfig',
      apiVersion: 'build.openshift.io/v1',
      metadata: {
        name: 'node-bulletin-board',
        namespace: 'mjf',
        creationTimestamp: null,
        labels: {
          app: 'node-bulletin-board',
          'app.kubernetes.io/component': 'node-bulletin-board',
          'app.kubernetes.io/instance': 'node-bulletin-board',
          'app.kubernetes.io/part-of': 'node-bulletin-board-app',
          deploymentconfig: 'node-bulletin-board',
        },
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
          isFromDevfile: 'true',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        triggers: null,
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/maysunfaisal/node-bulletin-board',
          },
          contextDir: '/',
        },
        strategy: {
          type: 'Docker',
          dockerStrategy: {
            dockerfilePath: 'Dockerfile',
          },
        },
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'maysun:latest',
          },
        },
        resources: {},
        postCommit: {},
        nodeSelector: null,
      },
      status: {
        lastVersion: 0,
      },
    },
    deployResource: {
      kind: 'Deployment',
      apiVersion: 'apps/v1',
      metadata: {
        name: 'node-bulletin-board',
        namespace: 'mjf',
        creationTimestamp: null,
        labels: {
          app: 'node-bulletin-board',
          'app.kubernetes.io/component': 'node-bulletin-board',
          'app.kubernetes.io/instance': 'node-bulletin-board',
          'app.kubernetes.io/part-of': 'node-bulletin-board-app',
          deploymentconfig: 'node-bulletin-board',
        },
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
          isFromDevfile: 'true',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'node-bulletin-board',
          },
        },
        template: {
          metadata: {
            name: 'node-bulletin-board',
            namespace: 'mjf',
            creationTimestamp: null,
            labels: {
              app: 'node-bulletin-board',
              deploymentconfig: 'node-bulletin-board',
            },
            annotations: {
              'alpha.image.policy.openshift.io/resolve-names': '*',
              'app.openshift.io/vcs-ref': 'master',
              'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
              'image.openshift.io/triggers':
                '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
              isFromDevfile: 'true',
              'openshift.io/generated-by': 'OpenShiftWebConsole',
            },
          },
          spec: {
            containers: [
              {
                name: 'runtime',
                image: 'maysun',
                ports: [
                  {
                    name: 'http-3000',
                    containerPort: 3000,
                  },
                ],
                env: [
                  {
                    name: 'PROJECTS_ROOT',
                    value: '/project',
                  },
                  {
                    name: 'PROJECT_SOURCE',
                    value: '/project',
                  },
                ],
                resources: {
                  limits: {
                    memory: '1Gi',
                  },
                },
                imagePullPolicy: 'Always',
              },
            ],
          },
        },
        strategy: {
          type: 'Recreate',
        },
      },
      status: {},
    },
    service: {
      kind: 'Service',
      apiVersion: 'v1',
      metadata: {
        name: 'node-bulletin-board',
        namespace: 'mjf',
        creationTimestamp: null,
        labels: {
          app: 'node-bulletin-board',
          'app.kubernetes.io/component': 'node-bulletin-board',
          'app.kubernetes.io/instance': 'node-bulletin-board',
          'app.kubernetes.io/part-of': 'node-bulletin-board-app',
          deploymentconfig: 'node-bulletin-board',
        },
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
          isFromDevfile: 'true',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        ports: [
          {
            name: 'port-3000',
            port: 3000,
            targetPort: 3000,
          },
        ],
        selector: {
          app: 'node-bulletin-board',
          deploymentconfig: 'node-bulletin-board',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
    route: {
      kind: 'Route',
      apiVersion: 'route.openshift.io/v1',
      metadata: {
        name: 'node-bulletin-board',
        namespace: 'mjf',
        creationTimestamp: null,
        labels: {
          app: 'node-bulletin-board',
          'app.kubernetes.io/component': 'node-bulletin-board',
          'app.kubernetes.io/instance': 'node-bulletin-board',
          'app.kubernetes.io/part-of': 'node-bulletin-board-app',
          deploymentconfig: 'node-bulletin-board',
        },
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/maysunfaisal/node-bulletin-board',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"maysun:latest","namespace":"mjf"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"maysun\\")].image","pause":"false"}]',
          isFromDevfile: 'true',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        host: '',
        path: '/',
        to: {
          kind: 'Service',
          name: 'node-bulletin-board',
          weight: null,
        },
        port: {
          targetPort: 3000,
        },
      },
      status: {
        ingress: null,
      },
    },
  },
};
