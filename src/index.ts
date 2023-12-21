import downloader from 'download';
import gitClone from 'git-clone';
import { sync } from 'rimraf';

interface normal {
	type: string;
	url?: string | undefined;
	checkout: string;
	origin?: string | undefined | null;
	owner?: string | undefined;
	name?: string | undefined;
}

async function download(repo: string, dest: string, opts?: any) {
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
		return gitClone(url!, dest, cloneOptions, function (err) {
			if (err === undefined) {
				sync(dest + '/.git');
				return;
			} else {
				return err;
			}
		});
	} else {
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
		return await downloader(url!, dest, downloadOptions)
			.then(function (data) {
				return data;
			})
			.catch(function (err) {
				return err;
			});
	}
}

function normalize(repo: string): normal {
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
	} else {
		const regex = /^(?:(github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/;
		const match = regex.exec(repo);
		const type = match![1] || 'github';
		let origin = match![2] || null;
		const owner = match![3];
		const name = match![4];
		const checkout = match![5] || 'main';

		if (origin == null) {
			if (type === 'github') {
				origin = 'github.com';
			} else if (type === 'gitlab') {
				origin = 'gitlab.com';
			} else if (type === 'bitbucket') {
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

function addProtocol(origin: string, clone: string): string {
	if (!/^(f|ht)tps?:\/\//i.test(origin)) {
		if (clone) {
			origin = 'git@' + origin;
		} else {
			origin = 'https://' + origin;
		}
	}

	return origin;
}

function getUrl(repo: normal, clone: string) {
	var url;
	var origin = addProtocol(repo.origin!, clone);

	if (/^git@/i.test(origin)) {
		origin = origin + ':';
	} else {
		origin = origin + '/';
	}

	if (clone) {
		url = origin + repo.owner + '/' + repo.name + '.git';
	} else {
		if (repo.type === 'github') {
			url = `https://codeload.github.com/${repo.owner}/${repo.name}/zip/refs/heads/${repo.checkout}`;
		} else if (repo.type === 'gitlab') {
			url = `https://gitlab.com/${repo.owner}/${repo.name}/-/archive/${repo.checkout}/${repo.name}-${repo.checkout}.zip`;
		} else if (repo.type === 'bitbucket') {
			url = `${origin + repo.owner}/${repo.name}/get/${repo.checkout}.zip`;
		}
	}

	return url;
}

export { download, addProtocol, normalize };
