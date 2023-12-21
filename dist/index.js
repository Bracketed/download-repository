import downloader from 'download';
import gitClone from 'git-clone';
import { sync } from 'rimraf';
/**
 * Download `repo` to `dest` and callback `fn(err)`.
 * @param {String} repo
 * @param {String} dest
 * @param {Object} opts
 */
async function download(repo, dest, opts) {
    opts = opts || {};
    const clone = opts.clone || false;
    delete opts.clone;
    const normalizedRepository = normalize(repo);
    const url = normalizedRepository.url || getUrl(normalizedRepository, clone);
    if (clone) {
        var cloneOptions = {
            checkout: normalizedRepository.checkout,
            shallow: normalizedRepository.checkout === 'master',
            ...opts,
        };
        return gitClone(url, dest, cloneOptions, function (err) {
            if (err === undefined) {
                sync(dest + '/.git');
                return;
            }
            else {
                return err;
            }
        });
    }
    else {
        var downloadOptions = {
            extract: true,
            strip: 1,
            mode: '666',
            ...opts,
            headers: {
                accept: 'application/zip',
                ...(opts.headers || {}),
            },
        };
        return await downloader(url, dest, downloadOptions)
            .then(function (data) {
            return data;
        })
            .catch(function (err) {
            return err;
        });
    }
}
/**
 * Normalize a repo string.
 *
 * @param {String} repo
 * @return {Object}
 */
function normalize(repo) {
    var regex = /^(?:(direct):([^#]+)(?:#(.+))?)$/;
    var match = regex.exec(repo);
    if (match) {
        var url = match[2];
        var directCheckout = match[3] || 'master';
        return {
            type: 'direct',
            url: url,
            checkout: directCheckout,
        };
    }
    else {
        const regex = /^(?:(github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/;
        const match = regex.exec(repo);
        const type = match[1] || 'github';
        let origin = match[2] || null;
        const owner = match[3];
        const name = match[4];
        const checkout = match[5] || 'main';
        if (origin == null) {
            if (type === 'github') {
                origin = 'github.com';
            }
            else if (type === 'gitlab') {
                origin = 'gitlab.com';
            }
            else if (type === 'bitbucket') {
                origin = 'bitbucket.org';
            }
        }
        return {
            type,
            origin,
            owner,
            name,
            checkout,
        };
    }
}
/**
 * Adds protocol to url in none specified
 * @return {String}
 */
function addProtocol(origin, clone) {
    if (!/^(f|ht)tps?:\/\//i.test(origin)) {
        if (clone) {
            origin = 'git@' + origin;
        }
        else {
            origin = 'https://' + origin;
        }
    }
    return origin;
}
/**
 * Return a zip or git url for a given `repo`.
 *
 * @param {Object} repo
 * @return {String}
 */
function getUrl(repo, clone) {
    var url;
    // Get origin with protocol and add trailing slash or colon (for ssh)
    var origin = addProtocol(repo.origin, clone);
    if (/^git@/i.test(origin)) {
        origin = origin + ':';
    }
    else {
        origin = origin + '/';
    }
    // Build url
    if (clone) {
        url = origin + repo.owner + '/' + repo.name + '.git';
    }
    else {
        if (repo.type === 'github') {
            url = origin + repo.owner + '/' + repo.name + '/archive/' + repo.checkout + '.zip';
        }
        else if (repo.type === 'gitlab') {
            url = origin + repo.owner + '/' + repo.name + '/repository/archive.zip?ref=' + repo.checkout;
        }
        else if (repo.type === 'bitbucket') {
            url = origin + repo.owner + '/' + repo.name + '/get/' + repo.checkout + '.zip';
        }
    }
    return url;
}
export { download };
//# sourceMappingURL=index.js.map