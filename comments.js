(function () {
    /**
     * @constructor
     */
    var CommentHelper = function () {
        this.slug = window.location.href.split('/').pop();
        this.url = 'https://nathandemick.com/api'; // Replace this w/ ur server

        this.writeForm();

        // Load reCAPTCHA
        var script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        document.head.appendChild(script);

        this.getComments();
    };

    // document.write the form for new comments here
    CommentHelper.prototype.writeForm = function () {
        var html = [
            '<div id="comments">',
            '<div id="comment_list"></div>',
            '<div id="comment_error_msg">There was a problem communicating with the comment server.</div>',
            '<form id="comment_form">',
            '<input type="hidden" name="slug" value="' + this.slug + '">',
            '<p><label for="comment_author">Name</label>',
            '<input id="comment_author" type="text" name="author" required="required"></p>',
            '<p><label for="comment_url">Website</label>',
            '<input id="comment_url" type="url" name="url"></p>',
            '<p><label for="comment_body">Comment</label>',
            '<textarea id="comment_body" name="body" required="required"></textarea></p>',
            '<div class="g-recaptcha" data-sitekey="6LeqwR8TAAAAAKl3dbC6494ll8Eki6ss5zBgWxxw"></div>',
            '<button>Send!</button>',
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
        this.commentErrorMessage = document.getElementById('comment_error_msg');
        this.hideError();

        this.commentForm.addEventListener('submit', this.postComment.bind(this));
    }

    CommentHelper.prototype.commentTemplate = function (context) {
        var authorName = context.author;

        if (context.url) {
            authorName = '<a href="' + context.url + '" rel="nofollow">' + authorName + '</a>';
        }

        var dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        var element = document.createElement('section');
        element.className = 'comment';
        element.innerHTML = [
            '<p><span class="name">' + authorName + '</span> wrote on ',
            '<span class="timestamp">' + new Date(context.timestamp * 1000).toLocaleDateString('en-US', dateOptions) + '</span>:</p>',
            '<p class="body">' + context.body + '</p>',
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

                    response.comments.forEach(function (params) {
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

        this.hideError();

        var params = {
            slug: this.slug,
            author: this.commentAuthor.value,
            url: this.commentUrl.value,
            body: this.commentBody.value,
            timestamp: Date.now() / 1000,
            'g-recaptcha-response': document.getElementById('g-recaptcha-response').value
        };

        var serializedParams = Object.keys(params).map(function (key) {
            return key + '=' + params[key];
        }).join('&');

        var request = new XMLHttpRequest();
        request.onreadystatechange = function (event) {
            if (request.readyState !== 4) {
                return;
            }

            if (Math.floor(request.status / 100) === 2) {
                this.commentList.appendChild(this.commentTemplate(params));
                this.commentForm.reset();
                grecaptcha.reset();
            } else {
                this.showError();
            }
        }.bind(this);
        request.open('POST', this.url + '/comments');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send(serializedParams);
    };

    CommentHelper.prototype.showError = function () {
        this.commentErrorMessage.style.display = 'block';
    };

    CommentHelper.prototype.hideError = function () {
        this.commentErrorMessage.style.display = 'none';
    };

    // Kick it off!
    var comments = new CommentHelper();
}());
