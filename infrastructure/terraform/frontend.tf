module "frontend" {
  source         = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website"
  prefix         = local.prefix
  hostname       = local.hostname
  site_directory = "${path.module}/../../dist"

  # Ahara's OG server becomes the default CloudFront HTML origin. Static assets
  # remain on S3, while crawlers receive metadata in the initial response.
  vpc         = module.ctx.vpc
  og_artifact = module.ctx.og_server

  og_config = {
    site_name = "Catalyst Castellum"
    defaults = {
      title       = "Catalyst Castellum"
      description = "A chemical-flow tower defense game about routing matter, engineering reactions, and defending the Catalyst Core."
      image       = "/social-card.png"
    }
    routes = [
      {
        pattern     = "/"
        query       = ""
        title       = "Catalyst Castellum"
        description = "A chemical-flow tower defense game about routing matter, engineering reactions, and defending the Catalyst Core."
        image       = "/social-card.png"
        og_type     = "website"
      }
    ]
  }
}
