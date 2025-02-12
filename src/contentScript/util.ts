export default {
    addCss: (css: string) => {
        document.getElementById('cbm-content-script-css')?.remove();
        const style = document.createElement('style');
        style.id = 'cbm-content-script-css';
        style.innerHTML = css;
        document.head.appendChild(style);
    }
}