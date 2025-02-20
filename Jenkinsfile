def buildDockerfile(folder_name, version) {
    echo "Building Dockerfile at ${folder_name}/Dockerfile for ${folder_name}... with version ${version}"

    // Build Docker image using the specified Dockerfile
    script {
        def completeImageName = "${env.DOCKER_HUB_REPO}/${folder_name}" // Concatenate repo with image name
        def image = docker.build(completeImageName, "-f ${folder_name}/Dockerfile ./${folder_name}")

        echo "Prepare to release newer version ${completeImageName}:${version}"
        docker.withRegistry('https://registry.hub.docker.com', env.DOCKER_HUB_CRED) {
            if (version  == 'latest-unstable') {
                image.push('latest-unstable')
            } else {
                image.push('latest')
                image.push(version)
            }
        }
    }
}

// For linto studio, the folder name have the same name of the docker image
def performBuildForFile(changedFiles, version) {
    if (changedFiles.contains('studio-api')) {
        echo 'Files in studio-api path are modified. Running specific build steps for studio-api...'
        buildDockerfile('studio-api', version)
    }

    if (changedFiles.contains('studio-frontend')) {
        echo 'Files in studio-frontend path are modified. Running specific build steps for studio-frontend...'
        buildDockerfile('studio-frontend', version)
    }

    if (changedFiles.contains('studio-websocket')) {
        echo 'Files in studio-websocket path are modified. Running specific build steps for studio-websocket...'
        buildDockerfile('studio-websocket', version)
    }

    if (changedFiles.contains('studio-dashboard')) {
        echo 'Files in studio-dashboard path are modified. Running specific build steps for studio-dashboard...'
        buildDockerfile('studio-dashboard', version)
    }
}

pipeline {
    agent any
    environment {
        DOCKER_HUB_REPO = "lintoai"
        DOCKER_HUB_CRED = 'docker-hub-credentials'
    }

    stages {
        stage('Docker build for master branch') {
            when {
                branch 'master'
            }
            steps {
                echo 'Publishing latest'
                script {
                    def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD^ HEAD').trim()
                    
                    version = sh(
                        returnStdout: true, 
                        script: "awk -v RS='' '/#/ {print; exit}' RELEASE.md | head -1 | sed 's/#//' | sed 's/ //'"
                    ).trim()
                    
                    performBuildForFile(changedFiles, version)
                }
            }
        }

        stage('Docker build for next (unstable) branch') {
            when {
                branch 'next'
            }
            steps {
                echo 'Publishing unstable'
                script {
                    def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD^ HEAD').trim()

                    performBuildForFile(changedFiles, 'latest-unstable')
                }
            }
        }
    }
}