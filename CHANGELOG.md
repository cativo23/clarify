# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.16] - 2026-03-25

### Changed
- CI/CD workflow matches portfolio auto-deploy structure
- Use `environment: prod` for deployment jobs
- Docker login on server before pulling images
- Use `docker compose down` before `up -d` for clean deploy

### Fixed
- Deploy workflow now uses correct secrets (`SSH_HOST`, etc.)
- Removed lint job from release pipeline (build + deploy only)

---

## [1.0.0-alpha.15] - 2026-03-25

### Added
- Auto-release GitHub Actions workflow for automated versioning
- Docker-based auto-deploy to home server via SSH
- `.env.example` template with all production environment variables
- Configurable worker concurrency via `BULLMQ_CONCURRENCY` environment variable
- Real Redis health check in `/api/health` endpoint
- Production deployment documentation (DEPLOY.md)

### Changed
- CI/CD pipeline now deploys via Docker Hub + SSH instead of Vercel
- Worker concurrency is now configurable (was hardcoded to 2)
- Health endpoint now performs actual Redis ping verification

### Fixed
- Chart rendering issues in admin analytics (using client components)
- Admin UAT tests now passing

### Documentation
- Complete production deployment guide with GitHub Actions setup
- Phase 07 planning, research, validation, and summary documents

---

## [v1.0.0-alpha.14] - 2026-03-24

### Added
- Phase 07: Production deployment readiness
- Environment configuration template
- Health check with Redis connectivity verification

### Added
- Auto-release GitHub Actions workflow for automated versioning
- Docker-based auto-deploy to home server via SSH
- `.env.example` template with all production environment variables
- Configurable worker concurrency via `BULLMQ_CONCURRENCY` environment variable
- Real Redis health check in `/api/health` endpoint
- Production deployment documentation (DEPLOY.md)

### Changed
- CI/CD pipeline now deploys via Docker Hub + SSH instead of Vercel
- Worker concurrency is now configurable (was hardcoded to 2)
- Health endpoint now performs actual Redis ping verification

### Fixed
- Chart rendering issues in admin analytics (using client components)
- Admin UAT tests now passing

### Documentation
- Complete production deployment guide with GitHub Actions setup
- Phase 07 planning, research, validation, and summary documents

---

## [v1.0.0-alpha.4] - 2026-03-24

### Added
- Phase 07: Production deployment readiness
- Environment configuration template
- Health check with Redis connectivity verification

---

## [v1.0.0-alpha.3] - 2026-03-23

### Added
- Admin analytics dashboard
- Revenue tracking charts
- Funnel analysis visualization

---

## [v1.0.0-alpha.2] - 2026-03-22

### Added
- Asynchronous analysis system
- BullMQ worker for queue processing
- Redis integration for job management

---

## [v1.0.0-alpha.1] - 2026-03-21

### Added
- Initial alpha release
- Core analysis functionality
- Basic UI with dark mode support
