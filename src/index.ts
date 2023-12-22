import downloader from 'download';

interface normal {
	type: string;
	url?: string | undefined;
	checkout: string;
	origin?: string | undefined | null;
	owner?: string | undefined;
	name?: string | undefined;
}

export default async function download(repo: string, dest: string) {
	const normalizedRepository = normalize(repo);
	const url = normalizedRepository.url || getUrl(normalizedRepository);

	if (!url) return false;

	return await downloader(url, dest, {
		extract: true,
		strip: 1,
		headers: {
			accept: 'application/zip',
		},
	})
		.then(() => true)
		.catch(() => false);
}

function normalize(repo: string): normal {
	const regex = /^(?:(direct):([^#]+)(?:#(.+))?)$/;
	const match: RegExpExecArray | null = regex.exec(repo);

	if (!match) {
		const regex: RegExp = /^(?:(github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/;
		const match: RegExpExecArray | null = regex.exec(repo);
		const type: string = match![1] || 'github';
		let origin: string | null = match![2] || null;
		const owner: string = match![3];
		const name: string = match![4];
		const checkout: string = match![5] || 'main';

		if (!origin) {
			switch (type) {
				case 'github':
					origin = 'github.com';
					break;
				case 'gitlab':
					origin = 'gitlab.com';
					break;
				case 'bitbucket':
					origin = 'bitbucket.org';
					break;
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

	return {
		type: 'direct',
		url: match[2],
		checkout: match[3] || 'master',
	};
}

function getUrl(repo: normal) {
	let url;

	switch (repo.type) {
		case 'github':
			url = `https://codeload.github.com/${repo.owner}/${repo.name}/zip/refs/heads/${repo.checkout}`;
			break;
		case 'gitlab':
			url = `https://gitlab.com/${repo.owner}/${repo.name}/-/archive/${repo.checkout}/${repo.name}-${repo.checkout}.zip`;
			break;
		case 'bitbucket':
			url = `https://bitbucket.org/${repo.owner}/${repo.name}/get/${repo.checkout}.zip`;
			break;
	}

	return url;
}
