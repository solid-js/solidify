/**
 * Expose React as __React on window if available.
 * We have to do since to avoid React import on each Typescript files.
 * Also without it, requirejs will try to load the lib with an http call.
 */
window['__React'] = ('React' in window ? window['React'] : {});
window['__React']['__DOM'] = ('ReactDOM' in window ? window['ReactDOM'] : {});