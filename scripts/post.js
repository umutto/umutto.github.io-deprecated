
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        document.getElementById("btn_top").style.display = "block";
    } else {
        document.getElementById("btn_top").style.display = "none";
    }
}


function scrollWindow(offsetTop) {
    window.scrollTo({
        'behavior': 'smooth',
        'left': 0,
        'top': offsetTop
    });
}
