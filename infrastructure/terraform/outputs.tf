output "url" {
  description = "Public game URL"
  value       = module.frontend.url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution serving the game"
  value       = module.frontend.distribution_id
}
