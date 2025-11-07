fetch("navbar.html")
    .then(r => r.text())
    .then(html => {
        document.getElementById('topbar-placeholder').innerHTML = html;
    })
// will be used later to avoid code duplication