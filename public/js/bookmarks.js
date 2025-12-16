async function toggleBookmark(button) {
    const postId = button.dataset.postId;
    const saved = Number(button.dataset.saved); // 0 of 1
    const newSaved = saved === 1 ? 0 : 1;

    const res = await fetch("/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId })
    });

    if (res.ok) {
        button.dataset.saved = newSaved;
        button.classList.toggle("saved", newSaved === 1);
    }
}
