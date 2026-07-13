# Shared Ahara platform resources. The website module consumes the VPC context
# and the published OG server artifact when OpenGraph mode is enabled.
module "ctx" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/platform-context"
}
