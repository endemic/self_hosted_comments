(function (root) {
    /**
     * @constructor
     */
    var CommentHelper = function () {
        // Load reCAPTCHA
        var script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        document.head.appendChild(script);

        this.slug = window.location.href.split('/').pop();
        this.url = 'http://localhost:4567'; // Replace this w/ ur server

        this.writeForm();
        this.getComments();
    };

    // document.write the form for new comments here
    CommentHelper.prototype.writeForm = function () {
        var html = [
            '<div id="comments">',
            '<div id="comment_list"></div>',
            '<form id="comment_form" action="' + this.url + '" method="POST">',
            '<input type="hidden" name="slug" value="' + this.slug + '">',
            '<label for="comment_author">Your name:</label>',
            '<input id="comment_author" type="text" name="author" required="required">',
            '<label for="comment_url">Your website:</label>',
            '<input id="comment_url" type="text" name="url">',
            '<label for="comment_body">Your comment:</label>',
            '<textarea id="comment_body" name="body" required="required"></textarea>',
            '<div class="g-recaptcha" data-sitekey="6LeqwR8TAAAAAKl3dbC6494ll8Eki6ss5zBgWxxw"></div>',
            '<button>Submit</button>',
            '</form>',
            '</div> <!-- /#comments -->'
        ].join('');

        document.write(html);

        // Get references to various bits
        this.commentList = document.getElementById('comment_list');
        this.commentAuthor = document.getElementById('comment_author');
        this.commentUrl = document.getElementById('comment_url');
        this.commentBody = document.getElementById('comment_body');
        this.commentForm = document.getElementById('comment_form');

        this.commentForm.addEventListener('submit', this.postComment.bind(this));
    }

    CommentHelper.prototype.commentTemplate = function (context) {
        var authorName = context.author;

        if (context.url) {
            authorName = '<a href="' + context.url + '" rel="nofollow">' + authorName + '</a>';
        }

        var element = document.createElement('section');
        element.className = 'comment';
        element.innerHTML = [
            '<span class="name">' + authorName + '</span>',
            '<span class="timestamp">' + context.timestamp + '</span>',
            '<span class="body">' + context.body + '</span>',
        ].join('');

        return element;
    };

    CommentHelper.prototype.getComments = function () {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function (event) {
            if (request.readyState !== 4) {
                return;
            }

            if (Math.floor(request.status / 100) === 2) {
                try {
                    var response = JSON.parse(request.responseText);

                    response.forEach(function (params) {
                        this.commentList.appendChild(this.commentTemplate(params));
                    }.bind(this));
                } catch (e) {
                    console.warn('Error parsing JSON response', e);
                    this.showError();
                }
            } else {
                    this.showError();
            }
        }.bind(this);
        request.open('GET', this.url + '/comments/' + this.slug);
        request.send();
    };

    CommentHelper.prototype.postComment = function (event) {
        event.preventDefault();

        var params = {
            slug: this.slug,
            author: this.commentAuthor.value,
            url: this.commentUrl.value,
            body: this.commentBody.value,
            timestamp: Date.now() / 1000
        };

        var serializedParams = Object.keys(params).map(function (key) {
            return key + '=' + params[key];
        }).join('&');

        var request = new XMLHttpRequest();
        request.onreadystatechange = function (event) {
            if (this.readyState !== 4) {
                return;
            }

            if (Math.floor(request.status / 100) === 2) {
                this.commentList.appendChild(this.commentTemplate(params));
            } else {
                this.showError();
            }
        }.bind(this);
        request.open('POST', this.url + '/comments');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send(serializedParams);
    };

    CommentHelper.prototype.showError = function () {
        console.warn('Implement this');
    };

    root.CommentHelper = CommentHelper;
}(window));
