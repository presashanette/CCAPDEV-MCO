$(document).ready(function() {
const elements = document.querySelectorAll('.btn');

$(document).on('click', '#collapse-button', function(e) {
    const $button = $(this);
    const $comment = $button.closest('.comment');
    const $replyContainer = $comment.find('.reply');
    
    $replyContainer.toggle();

    if ($replyContainer.is(':visible')) {
        $button.text('Collapse');
    } else {
        $button.text('Expand');
    }
});

$(document).on('click', '#reply-button', function(e) {
    const $button = $(this);
    const postId = $button.attr('data-post-id');

    console.log("post id in comment REPLY" + postId);

    const parentCommentId = $button.attr('data-comment-id');
    var replyContent = $('.replyInput').text();

    $.ajax({
            type: 'POST',
            url: '/reply/comment/' + postId + '/' + parentCommentId,
            data: { content: replyContent },
            success: function(response) {
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
});


$(document).on('click', '#edit-button', function(e) {
    var $button = $(this);
    var parentComment = $button.closest('.comment');
    var editableDiv = parentComment.find(".editable");
    var modal = $("#myModal1");

    const $target = $(e.target);
    const postId = $target.attr('data-post-id');
    console.log("post id in comment EDIT" + postId);
    const commentId = $target.attr('data-comment-id');

    if (editableDiv.prop("contentEditable") === "true") {
        editableDiv.prop("contentEditable", false);
        $button.text("Edit"); 

        var newContent = editableDiv.text();
        
        fetch(`/editComment/${postId}/${commentId}`)
            .then(response => {
                if(newContent == ""){
                    modal.style.display = "block";
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });

        $.ajax({
            type: 'PUT',
            url: `/editComment/${postId}/${commentId}`, 
            data: { content: newContent }, 
            success: function(response) {
                console.log("Comment updated successfully!");
                location.reload();
            },
            error: function(err){
                console.log(err);
                alert('Unauthorized: You cannot edit this comment.');
                location.reload();
            }
        });
    } else {

        editableDiv.prop("contentEditable", true);
        $button.text("Save"); 
    }
});

  $(document).on('click', '#delete-button', function(e) {

    const $button = $(this);
    const postId = $button.attr('data-post-id');

    console.log("post id in comment DELETE" + postId);
    const commentId = $button.attr('data-comment-id');

    $.ajax({
        type: 'DELETE',
        url: `/deleteComment/${postId}/${commentId}`,
        success: function(response) {
            $button.closest('.comment').remove();
            $('#comment-count').text($('.comment').length);
            alert('Comment deleted successfully!');
        },
        error: function(err){
            alert('Unauthorized: You cannot delete this comment.');
            console.log(err);
        }
    });
});

});