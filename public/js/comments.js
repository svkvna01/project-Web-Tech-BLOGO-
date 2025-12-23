console.log("comments.js loaded");

/**
 * Opens and closed the comments panel for a post
 * The post ID is retrieved from the clicked button using a data attribute post-id.
 * This allows the correct comments panel to be opened or closed.
 */

function openComments(button) {
    const postId = button.dataset.postId;
    document
        .getElementById("comments-panel-" + postId)
        .classList.add("open");
}

function closeComments(button) {
    const postId = button.dataset.postId;
    document
        .getElementById("comments-panel-" + postId)
        .classList.remove("open");
}

/**
* This function ensures that the user does not immediately see options such as ‘delete ’ and ‘edit ’ 
* These options only become visible when the user clicks 
* the corresponding button. **/

function toggleMenu(btn) {
    const comment = btn.closest(".comment");
    comment.classList.toggle("show-menu");
    comment.classList.remove("show-edit");
}
function toggleEdit(btn) {
    const comment = btn.closest(".comment");
    comment.classList.remove("show-menu");
    comment.classList.toggle("show-edit");
}

function toggleReply(btn) {
    const comment = btn.closest(".comment");
    comment.classList.toggle("show-reply");
}

function toggleReplyMenu(btn) {
    const reply = btn.closest(".reply");
    reply.classList.toggle("show-menu");
    reply.classList.remove("show-edit");
    reply.classList.remove("show-reply");
}

function toggleReplyEdit(btn) {
    const reply = btn.closest(".reply");
    reply.classList.remove("show-menu");
    reply.classList.toggle("show-edit");
}


/**
 * Handles reply, edit and delete actions inside an open comments panel.
 * The panel is refreshed without reloading the rest of the page,
 * so changes remain visible to the user.
 */
function submitCommentPanel(e, form) {
    e.preventDefault(); 

    const $form = $(form);
    const $panel = $form.closest(".comments-panel");
    const panelId = $panel.attr("id");

    $.post(form.action, $form.serialize(), function () {
        $("#" + panelId).load(
            location.href + " #" + panelId + " > *",
            function () {
                $("#" + panelId).addClass("open");
            }
        );
    });
}

/**
 * Submits a new comment without reloading the entire page,
 * so the user stays on the same post while the comments are updated.
 */

function submitCommentPost(e, form) {
    e.preventDefault();

    const $form = $(form);
    const postId = $form.find('input[name="post_id"]').val();
    const panelId = "comments-panel-" + postId;

    $.post(form.action, $form.serialize(), function () {
        // reset textarea
        $form.find("textarea").val("");

        // reload panel so new comment appears
        $("#" + panelId).load(
            location.href + " #" + panelId + " > *"
        );
    });
}

