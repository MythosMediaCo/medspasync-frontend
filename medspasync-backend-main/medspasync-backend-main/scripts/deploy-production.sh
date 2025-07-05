#!/bin/bash

# Phase 2 Production Deployment Script for MedSpa Analytics Pro
# This script deploys the complete analytics platform with monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="medspa-analytics-pro"
ENVIRONMENT="production"
VERSION="2.0.0"

echo -e "${BLUE}🚀 MedSpa Analytics Pro - Phase 2 Production Deployment${NC}"
echo -e "${BLUE}Version: ${VERSION} | Environment: ${ENVIRONMENT}${NC}"
echo "=================================================="

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ helm is not installed${NC}"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to create namespace and secrets
setup_namespace() {
    echo -e "${YELLOW}🏗️  Setting up namespace and secrets...${NC}"
    
    # Create namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets (in production, these should be managed by a secrets manager)
    kubectl create secret generic postgres-secret \
        --namespace=${NAMESPACE} \
        --from-literal=username=medspa_analytics \
        --from-literal=password=$(openssl rand -base64 32) \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic redis-secret \
        --namespace=${NAMESPACE} \
        --from-literal=password=$(openssl rand -base64 32) \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic jwt-secret \
        --namespace=${NAMESPACE} \
        --from-literal=secret=$(openssl rand -base64 64) \
        --from-literal=refresh-secret=$(openssl rand -base64 64) \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo -e "${GREEN}✅ Namespace and secrets created${NC}"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️  Deploying infrastructure components...${NC}"
    
    # Deploy PostgreSQL
    kubectl apply -f deployment/phase2-deployment.yml
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres-analytics -n ${NAMESPACE} --timeout=300s
    
    # Wait for Redis to be ready
    echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=redis-streams -n ${NAMESPACE} --timeout=300s
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
}

# Function to deploy monitoring stack
deploy_monitoring() {
    echo -e "${YELLOW}📊 Deploying monitoring stack...${NC}"
    
    # Add Prometheus Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Deploy Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace ${NAMESPACE} \
        --create-namespace \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
        --set grafana.enabled=true \
        --set grafana.adminPassword=admin123 \
        --wait
    
    # Deploy Grafana dashboards
    kubectl apply -f deployment/grafana-dashboards.yml -n ${NAMESPACE}
    
    echo -e "${GREEN}✅ Monitoring stack deployed${NC}"
}

# Function to deploy application services
deploy_application() {
    echo -e "${YELLOW}🚀 Deploying application services...${NC}"
    
    # Build and push Docker image (in production, this would be done by CI/CD)
    echo -e "${YELLOW}📦 Building Docker image...${NC}"
    docker build -t medspa-analytics-pro:${VERSION} .
    
    # Deploy real-time pipeline
    kubectl apply -f deployment/phase2-deployment.yml
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=realtime-pipeline -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=predictive-analytics -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=analytics-api -n ${NAMESPACE} --timeout=300s
    
    echo -e "${GREEN}✅ Application services deployed${NC}"
}

# Function to run health checks
run_health_checks() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    # Check all pods are running
    PODS=$(kubectl get pods -n ${NAMESPACE} -o jsonpath='{.items[*].status.phase}')
    for pod_status in $PODS; do
        if [ "$pod_status" != "Running" ]; then
            echo -e "${RED}❌ Some pods are not running properly${NC}"
            kubectl get pods -n ${NAMESPACE}
            exit 1
        fi
    done
    
    # Check API endpoints
    API_URL=$(kubectl get service analytics-api -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -n "$API_URL" ]; then
        echo -e "${YELLOW}🔍 Testing API endpoints...${NC}"
        
        # Health check
        if curl -f http://${API_URL}:3000/health; then
            echo -e "${GREEN}✅ API health check passed${NC}"
        else
            echo -e "${RED}❌ API health check failed${NC}"
            exit 1
        fi
        
        # Analytics endpoint check
        if curl -f http://${API_URL}:3000/api/analytics/health; then
            echo -e "${GREEN}✅ Analytics endpoint check passed${NC}"
        else
            echo -e "${RED}❌ Analytics endpoint check failed${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ All health checks passed${NC}"
}

# Function to display deployment info
display_info() {
    echo -e "${BLUE}📊 Deployment Information${NC}"
    echo "=================================================="
    
    # Get service URLs
    echo -e "${YELLOW}🌐 Service Endpoints:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}📈 Monitoring URLs:${NC}"
    echo "Grafana: http://$(kubectl get service prometheus-grafana -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):80"
    echo "Username: admin"
    echo "Password: admin123"
    
    echo -e "\n${YELLOW}🔧 Useful Commands:${NC}"
    echo "View logs: kubectl logs -f deployment/realtime-pipeline -n ${NAMESPACE}"
    echo "Check pods: kubectl get pods -n ${NAMESPACE}"
    echo "Check services: kubectl get services -n ${NAMESPACE}"
    echo "Port forward: kubectl port-forward service/analytics-api 3000:3000 -n ${NAMESPACE}"
    
    echo -e "\n${GREEN}🎉 Phase 2 deployment completed successfully!${NC}"
    echo -e "${GREEN}Your MedSpa Analytics Pro platform is now live in production.${NC}"
}

# Main deployment flow
main() {
    check_prerequisites
    setup_namespace
    deploy_infrastructure
    deploy_monitoring
    deploy_application
    run_health_checks
    display_info
}

# Run main function
main "$@" 