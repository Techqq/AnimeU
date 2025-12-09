/** Sora Module — UniqueStream Dubbed Anime (Dec 2025) */
/** Fixed: Uses v1/search endpoint + debug logs */

/** searchResults — v1 endpoint (correct one) */
async function searchResults(keyword) {
    try {
        console.log('Searching for:', keyword);  // Debug: Shows in Sora logs
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `https://anime.uniquestream.net/api/v1/search?page=1&query=${encodedKeyword}&language=dub`;
        const responseText = await soraFetch(url);
        console.log('Response length:', responseText ? responseText.length : 0);  // Debug: Should be >100

        if (!responseText) return JSON.stringify([]);

        const data = JSON.parse(responseText);
        console.log('Data keys:', Object.keys(data));  // Debug: Should include 'series'

        const filteredAnimes = (data.series || []).filter(anime => anime.dubbed === true);
        console.log('Dubbed count:', filteredAnimes.length);  // Debug: >0 for working search

        const transformedResults = filteredAnimes.map(anime => ({
            title: anime.name || anime.title,
            image: anime.poster || anime.image,
            href: `https://anime.uniquestream.net/watch/${anime.content_id}`  // Uses content_id (correct field)
        }));

        console.log('Final results:', transformedResults.length);  // Debug: Should be >0
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Search error:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

/** extractDetails */
async function extractDetails(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);
        if (!match) return JSON.stringify([{ description: 'Invalid URL', aliases: '', airdate: '' }]);
        const encodedID = match[1];
        const response = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${encodedID}`);
        if (!response) return JSON.stringify([{ description: 'No data', aliases: '', airdate: '' }]);
        const data = JSON.parse(response);
        
        const animeInfo = data.anime?.info || {};
        const moreInfo = data.anime?.moreInfo || {};

        const transformedResults = [{
            description: animeInfo.description || 'No description available',
            aliases: `Duration: ${animeInfo.stats?.duration || 'Unknown'}`,
            airdate: `Aired: ${moreInfo?.aired || animeInfo.released || 'Unknown'}`
        }];
        
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Duration: Unknown',
            airdate: 'Aired: Unknown'
        }]);
    }
}

/** extractEpisodes */
async function extractEpisodes(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);
        if (!match) return JSON.stringify([]);
        const encodedID = match[1];
        const response = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${encodedID}`);
        if (!response) return JSON.stringify([]);
        const data = JSON.parse(response);

        const episodes = data.anime?.episodes?.dub || [];

        const transformedResults = episodes.map(episode => ({
            href: `https://anime.uniquestream.net/watch/${encodedID}?ep=${episode.episode_number}`,
            number: episode.number || episode.episode_number
        }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Episodes error:', error);
        return JSON.stringify([]);
    }    
}

/** extractStreamUrl */
async function extractStreamUrl(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+?)\?ep=(\d+)$/);
        if (!match) return null;
        const encodedID = match[1];
        const epNum = match[2];
        const response = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${encodedID}/episode/${epNum}/sources`);
        if (!response) return null;
        const data = JSON.parse(response);
        
        const hlsSource = (data.data?.sources || []).find(source => source.type === 'hls');
        
        return hlsSource ? hlsSource.url : null;
    } catch (error) {
        console.log('Stream error:', error);
        return null;
    }
}

/** soraFetch — Full headers for Cloudflare bypass */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://anime.uniquestream.net/',
        'Origin': 'https://anime.uniquestream.net',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    };

    const finalHeaders = { ...defaultHeaders, ...options.headers };

    try {
        return await fetchv2(url, finalHeaders, options.method ?? 'GET', options.body ?? null);
    } catch (e) {
        try {
            const res = await fetch(url, { ...options, headers: finalHeaders });
            return await res.text();
        } catch (error) {
            console.log('soraFetch error: ' + error.message);
            return null;
        }
    }
}