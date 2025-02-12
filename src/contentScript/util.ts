export default {
    addCss: (css: string, id: string = 'cbm-content-script-css') => {
        document.getElementById('cbm-content-script-css')?.remove();
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = css;
        document.head.appendChild(style);
    }
}