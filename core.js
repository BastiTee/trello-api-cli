tsCore = function() {
    'use strict';

    var getRaw = function(tc, argv) {
        assertArgument(argv.p, '-p <API-PATH> not provided.');
        get(tc, argv.p).then((data) => {
            console.log(data.payload);
        });
    }

    var getBoardIds = function(tc, argv) {
        get(tc, '/1/members/me/boards').then((data) => {
            for (var board of data.payload) {
                console.log(board.id + ' \"' + board.name + '\"');
            }
        });
    }

    var getBoardLists = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.')
        get(tc, '/1/boards/' + argv.b + '/lists').then((data) => {
            for (var board of data.payload) {
                console.log(board.id + ' \"' + board.name + '\"');
            }
        });
    }

    var getLabels = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.')
        console.error('<<LABEL-ID>> <<LABEL-NAME>>');
        get(tc, '/1/boards/' + argv.b + '/labels').then((data) => {
            for (var label of data.payload) {
                console.log(label.id + ' \"' + label.name + '\"');
            }
        });
    }

    var getCardStatistics = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.');
        assertArgument(argv.f, '-f <FROM> not provided (YYYY-MM-DD)');
        assertArgument(argv.t, '-t <TO> not provided (YYYY-MM-DD)');
        for (var d = new Date(argv.f); d < new Date(argv.t); d.setDate(d.getDate() + 1)) {
            var since = dateToTrelloString(d);
            var beforeDate = new Date(d);
            beforeDate.setDate(beforeDate.getDate() + 1);
            var before = dateToTrelloString(beforeDate);
            console.log(since + " --> " + before);
            get(tc, '/1/boards/' + argv.b + '/cards', {
                limit: 1000,
                filter: 'all',
                before: before,
                since: since,
                actions: "updateCard:closed",
            }).then((data) => {
                for (var card of data.payload) {
                    var cdate = dateToTrelloString(new Date(card.actions[0].date));
                    console.log(cdate + " " + card.id + " CLOSED " +
                        card.idList + " " + clearCardName(card.name));
                }
            });
            get(tc, '/1/boards/' + argv.b + '/cards', {
                limit: 1000,
                filter: 'all',
                before: before,
                since: since,
                actions: "createCard",
            }).then((data) => {
                for (var card of data.payload) {
                    var cdate = dateToTrelloString(new Date(card.actions[0].date));
                    console.log(cdate + " " + card.id + " CREATE " +
                        card.idList + " " + clearCardName(card.name));
                }
            });
        }

    }

    var getCardLabels = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.');
        assertArgument(argv.l, '-l <LIMIT> not provided.');
        console.error('<<CARD-ID>> <<CARD-DESC>> <<ID-LABEL-1>> .. <<ID-LABEL-N>>');
        get(tc, '/1/boards/' + argv.b + '/cards', {
            limit: argv.l,
            filter: 'all'
        }).then((data) => {
            for (var card of data.payload) {
                card.name = card.name.split('\"').join('');
                console.log(card.id + ' \"' + card.name + '\" ' + card.idLabels.join(' '));
            }
        });
    }

    var setCardLabel = function(tc, argv) {
        assertArgument(argv.c, '-c <CARD-ID> not provided.');
        assertArgument(argv.l, '-l <LABEL-ID> not provided.');
        get(tc, '/1/cards/' + argv.c).then((data) => {
            var card = data.payload;
            console.log('-- ' + card.id + ' => \"' + card.name + '\"');
            if (card.idLabels === undefined || card.idLabels.length <= 0) {
                console.log('   + no labels found')
                return Promise.resolve();
            }
            var chain = []
            for (var idLabel of card.idLabels) {
                console.log('   + removing label ' + idLabel)
                chain.push(del(tc, '/1/cards/' + argv.c + '/idLabels/' + idLabel));
            }
            return Promise.all(chain);
        }).then((data) => {
            console.log('   + appending label ' + argv.l);
            return post(tc, '/1/cards/' + argv.c + '/idLabels', {
                value: argv.l,
            });
        }).then((data) => {
            console.log('   + done');
        });
    }

    var moveClosedCardToLastList = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.');
        var lastListId;
        get(tc, '/1/boards/' + argv.b + '/lists').then((data) => {
            lastListId = data.payload[data.payload.length - 1].id;
            return get(tc, '/1/boards/' + argv.b + '/cards', {
                limit: 1000,
                filter: 'closed'
            });
        }).then((data) => {
            var cards = data.payload;
            var chain = [];
            for (var card of cards) {
                if (lastListId == card.idList) {
                    continue;
                }
                console.log('moving card ' + card.id);
                chain.push(put(tc, '/1/cards/' + card.id + '/idList', {
                    value: lastListId,
                }));
            }
            return Promise.all(chain);
        }).then((data) => {
            console.log('Done');
        });
    }

    var getBoardStructure = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.');
        get(tc, '/1/boards/' + argv.b + '/lists').then((data) => {
            for (var list of data.payload) {
                get(tc, '/1/lists/' + list.id + '/cards', {
                    limit: 1000,
                    filter: 'all'
                }, {
                    listName: list.name,
                }).then(function(data) {
                    var cards = data.payload;
                    cards.sort(function(a, b) {
                        if (a.closed)
                            return 1;
                        else if (b.closed)
                            return -1;
                        else
                            return 0;
                    })
                    for (var card of cards) {
                        var list = data.vars.listName;
                        var state = card.closed ? 'closed' : 'open';
                        console.log(list + ';' + state + ';\"' +
                            card.name + '\"');
                    }
                });
            }
        });
    }

    var postNewCard = function(tc, argv) {
        assertArgument(argv.l, '-l <LIST-ID> not provided.');
        assertArgument(argv.d, '-d <CARDLABEL> not provided.');
        var labels = []
        if (argv.a) {
            labels = [argv.a]
        }
        post(tc, '/1/cards/', {
            name: argv.d,
            pos: "top",
            idList: argv.l,
            idLabels: labels
        });
    }

    // -----------------------------------------------------------------------
    return {
        getRaw: getRaw,
        getBoardIds: getBoardIds,
        getLabels: getLabels,
        getCardStatistics: getCardStatistics,
        getCardLabels: getCardLabels,
        setCardLabel: setCardLabel,
        moveClosedCardToLastList: moveClosedCardToLastList,
        getBoardStructure: getBoardStructure,
        postNewCard: postNewCard,
        getBoardLists: getBoardLists
    };
    // -----------------------------------------------------------------------

    function get(tc, path, options, vars) {
        return new Promise(function(resolve, reject) {
            var varsLocal = vars;
            tc.get(path, options, function(err, data) {
                if (err) {
                    handleError(err)
                } else {
                    resolve({
                        payload: data,
                        vars: varsLocal
                    });
                }
            });
        });
    };

    function post(tc, path, options) {
        return new Promise(function(resolve, reject) {
            tc.post(path, options, function(err, data) {
                // console.error('--pos--');
                err ? handleError(err) : resolve(data);
            });
        });
    };

    function put(tc, path, options) {
        return new Promise(function(resolve, reject) {
            tc.put(path, options, function(err, data) {
                // console.error('--put--');
                err ? handleError(err) : resolve(data);
            });
        });
    };

    function del(tc, path, options) {
        return new Promise(function(resolve, reject) {
            tc.del(path, options, function(err, data) {
                // console.error('--del--');
                err ? handleError(err) : resolve(data);
            });
        });
    };

    function clearCardName(name) {
        return name.split(/[^a-zA-Z0-9\-üöäÜÄÖß]+/).join("_").substring(0, 40);
    }

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    function dateToTrelloString(d) {
        var date = d.getDate();
        var month = d.getMonth();
        month++;
        var year = d.getFullYear();
        return year + "." + pad(month, 2) + "." + pad(date, 2);
    }

    function assertArgument(arg, message) {
        if (arg === undefined) {
            console.error(message);
            process.exit(1);
        }
    };

    function handleError(err) {
        if (err) {
            console.log('ERROR: ' + err);
            process.exit(1);
        }
    };
}();