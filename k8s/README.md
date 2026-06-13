# Kubernetes deployment notes

These manifests provide a practical baseline for deploying the Voistra backend in Kubernetes with:

- PostgreSQL
- Redis
- Coturn
- backend deployment
- migration job
- cluster service
- ingress

## Before first deploy

1. Build and push the backend image.
2. Replace `ghcr.io/example/voistra-server:latest` in:
   - `deployment.yaml`
   - `migration-job.yaml`
3. Update values in `secret.yaml`.
4. Update public domains in:
   - `configmap.yaml`
   - `ingress.yaml`
5. Make sure your ingress controller is already installed.
6. Make sure your cluster nodes or external firewall allow Coturn traffic:
   - `3478/tcp`
   - `3478/udp`
   - relay UDP range configured inside `coturn-deployment.yaml`

## Apply order

```bash
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f coturn-deployment.yaml
kubectl apply -f migration-job.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
```

## Backend health endpoint

The application uses a global `/api` prefix, so probes and monitoring must call:

```text
/api/health
```

## Notes about WebSocket and desktop client

- The same backend service handles both REST and Socket.IO traffic.
- Ingress must support long-lived connections for `/socket.io`.
- The desktop client should connect to the public backend host exposed by ingress.

## Notes about Coturn

The included Coturn manifest uses `hostNetwork: true` to simplify UDP relay exposure in Kubernetes.
This is acceptable for a diploma or a controlled environment, but for production you should validate:

- node-level firewall rules
- public IP / DNS mapping
- security restrictions for the node pool hosting Coturn

## Recommended next production improvements

- add CI/CD image publishing
- add HorizontalPodAutoscaler
- add PodDisruptionBudget
- move PostgreSQL and Redis to managed services if available
- rotate JWT and TURN secrets through your secret manager
