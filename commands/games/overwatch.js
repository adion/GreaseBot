const request = require('request');

module.exports = {
    displayName: 'Overwatch',
    listingUrl: 'http://overwatch.wikia.com/api/v1/Articles/List?category=Patch+notes',
    contentsUrl: 'http://overwatch.wikia.com/api/v1/Articles/AsSimpleJson?id=',
    fetch(options, done) {
        const HEADING_LEVELS = ['__**%s**__', '***%s***', '**%s**'],
            listingCallback = (err, res, data) => {
                if (err || res.statusCode !== 200) {
                    console.log(err);
                    return;
                }

                const listings = JSON.parse(data),
                    patches = listings.items.filter(item => {
                            return item.title !== 'List of Patches';
                        }).sort((a, b) => {
                            const regex = /^([\w,\s]*)(?:\(beta\))?$/,
                                aMatches = a.title.match(regex),
                                bMatches = b.title.match(regex),
                                aDate = new Date(aMatches[1]),
                                bDate = new Date(bMatches[1]);

                            return aDate - bDate;
                        }).reverse(),
                    OFFSET = options.patchesAgo >= patches.length ?
                        0 : Math.abs(options.patchesAgo),
                    patch = patches[OFFSET];

                request(this.contentsUrl + patch.id, contentsCallback);
            },
            contentsCallback = (err, res, data) => {
                if (err || res.statusCode !== 200) {
                    console.log(err);
                    return;
                }

                const buildContent = (elements, content) => {
                        return elements.reduce((prev, cur) => {
                            const delimeter = cur.type === 'paragraph' ? '\n' : '- ',
                                text = cur.text ? delimeter + cur.text : '';

                            return buildContent(cur.elements || [], (prev ? prev + '\n' + text : text));
                        }, content);
                    },
                    compileSectionContents = (prev, cur) => {
                        let content = buildContent(cur.content);

                        content = HEADING_LEVELS[cur.level - 1].replace('%s', cur.title) +
                            (content ? '\n' + content : '');

                        return (prev ? prev + '\n' + content : content) + '\n';
                    },
                    contents = JSON.parse(data),
                    compiled = `${this.displayName} patch notes for ` +
                        contents.sections.reduce(compileSectionContents, null);

                done(compiled);
            };

        // go get it!
        request(this.listingUrl, listingCallback);
    }
};
