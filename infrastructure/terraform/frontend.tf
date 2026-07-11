module "frontend" {
  source         = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website"
  prefix         = local.prefix
  hostname       = local.hostname
  site_directory = "${path.module}/../../dist"
}
