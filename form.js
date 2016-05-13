(function () {
    var script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    document.head.appendChild(script);

    var slug = window.location.href.split('/').pop();
    var url = 'http://localhost:4567';

    // Query comment server for comments, then format/display them
    // rel=nofollow for website links

    // document.write the form for new comments here
    var html = [
        '<form action="' + url + '" method="POST">',
        '<input type="hidden" name="slug" value="' + slug + '">',
        '<label for="comment_author">Your name:</label><input id="comment_author" type="text" name="author">',
        '<label for="comment_website">Your website:</label><input id="comment_website" type="text" name="url">',
        '<label for="comment_body">Your comment:</label><textarea id="comment_body" name="body"></textarea>',
        '<div class="g-recaptcha" data-sitekey="6LeqwR8TAAAAAKl3dbC6494ll8Eki6ss5zBgWxxw"></div>',
        '</form>'
    ].join('');

    document.write(html);
});
