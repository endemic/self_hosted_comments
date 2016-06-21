(function () {
    // polyfill, because I'm lazy
    if (!Array.prototype.compact) {
        Array.prototype.compact = function () {
            var emptyValues = [null, undefined, ''];
            for (var i = 0; i < this.length; i += 1) {
                if (emptyValues.indexOf(this[i]) > -1) {
                    this.splice(i, 1);
                }
            }
            return this;
        };
    }

    /**
     * @constructor
     */
    var CommentHelper = function () {
        this.slug = window.location.pathname.split('/').compact().pop();
        this.url = 'https://nathandemick.com/api'; // Replace this w/ ur server
        this.captchaSiteKey = '6LeqwR8TAAAAAKl3dbC6494ll8Eki6ss5zBgWxxw'; // Replace this w/ ur key

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
            '<div class="g-recaptcha" data-sitekey="' + this.captchaSiteKey + '"></div>',
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
        this.httpRequest({
            url: this.url + '/comments/' + this.slug,
            callback: function (errorText, responseText) {
                if (errorText) {
                    return this.showError();
                }

                try {
                    var response = JSON.parse(request.responseText);

                    response.comments.forEach(function (params) {
                        this.commentList.appendChild(this.commentTemplate(params));
                    }.bind(this));
                } catch (_) {
                    this.showError();
                }
            }.bind(this)
        });
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

        this.httpRequest({
            params: params,
            method: 'POST',
            url: this.url + '/comments',
            callback: function (errorText, responseText) {
                if (errorText) {
                    return this.showError();
                }

                this.commentList.appendChild(this.commentTemplate(params));
                this.commentForm.reset();
                grecaptcha.reset();
            }.bind(this)
        });
    };

    CommentHelper.prototype.showError = function () {
        this.commentErrorMessage.style.display = 'block';
    };

    CommentHelper.prototype.hideError = function () {
        this.commentErrorMessage.style.display = 'none';
    };

    CommentHelper.prototype.getCount = function () {
        // Turn HTMLCollection -> Array
        var commentAnchors = Array.prototype.slice.call(document.getElementsByClassName('comments'), 0).filter(function (anchor) {
            // If count is zero, add slug to array that will be sent to the server
            if (anchor.dataset["commentCount"] && parseInt(anchor.dataset["commentCount"], 10) === 0) {
                return anchor;
            }
        });

        // Generate slugs
        commentAnchors.forEach(function (anchor, index, array) {
            var slug = anchor.href.split('/').compact().pop();
            array[index].slug = slug.slice(0, slug.indexOf('#'));    // Remove trailing `#comments`
        });

        var params = {
            slugs: commentAnchors.map(function (anchor) {
                return anchor.slug;
            })
        };

        this.httpRequest({
            params: params,
            method: 'GET',
            url: this.url + '/comments/count',
            callback: function (errorText, responseText) {
                var counts;

                try {
                    counts = JSON.parse(responseText);
                } catch (_) {
                    counts = {};
                }

                commentAnchors.forEach(function (anchor) {
                    if (counts[anchor.slug] && counts[anchor.slug] > 0) {
                        anchor.text = counts[anchor.slug] + ' comments';
                    }
                });
            }
        });
    };

    CommentHelper.prototype.httpRequest = function (options) {
        // options = {params, method, url, callback}
        options = options || {};
        options.params = options.params || {};
        options.method = options.method || 'https://www.google.com';
        options.method = options.method || 'GET';
        options.callback = options.callback || function () {};

        var serializedParams = Object.keys(params).map(function (key) {
            return key + '=' + params[key];
        }).join('&');

        var request = new XMLHttpRequest();
        request.onreadystatechange = function (event) {
            if (request.readyState !== XMLHttpRequest.DONE) {
                return;
            }

            if (Math.floor(request.status / 100) === 2) {
                options.callback(null, request.responseText);
            } else {
                options.callback(request.responseText);
            }
        };
        request.open(options.method, options.url);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send(serializedParams);
    };

    // Kick it off!
    var comments = new CommentHelper();
}());

