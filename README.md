# Comments

Self-hosted comment app for static blogs (Jekyll, in my case). It uses reCAPTCHA
for validation.

1. Run the server somewhere
2. Include the JavaScript on your post detail page
3. ???
4. Profit!

## Future

I would like to run a script which searches through my posts that are older than
a certain threshold, queries the server for comments, then embeds them in the
post YAML. The comments would then be considered "closed" for that post, and
no additional requests to the server would be necessary. This would also somewhat
mitigate the need for long-term backup of the server database.
