tsCore = function() {
    'use strict';

    var getRaw = function(tc, argv) {
        assertArgument(argv.p, '-p <API-PATH> not provided.');
        get(tc, argv.p, {}).then((data) => {
            console.log(data.data);
        });
    }

    var getBoardIds = function(tc, argv) {
        get(tc, '/1/members/me/boards').then((boards) => {
            for (var board of boards) {
                console.log(board.id + ' \'' + board.name + '\'');
            }
        });
    }

    var getLabels = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.')
        console.error('<<LABEL-ID>> <<LABEL-NAME>>');
        get(tc, '/1/boards/' + argv.b + '/labels').then((labels) => {
            for (var label of labels) {
                console.log(label.id + ' \'' + label.name + '\'');
            }
        });
    }

    var getCardLabels = function(tc, argv) {
        assertArgument(argv.b, '-b <BOARD-ID> not provided.');
        assertArgument(argv.l, '-l <LIMIT> not provided.');
        console.error('<<CARD-ID>> <<CARD-DESC>> <<ID-LABEL-1>> .. <<ID-LABEL-N>>');
        get(tc, '/1/boards/' + argv.b + '/cards', {
            limit: argv.l,
            filter: 'all'
        }).then((cards) => {
            for (var card of cards) {
                card.name = card.name.split('\'').join('');
                console.log(card.id + ' \'' + card.name + '\' ' + card.idLabels.join(' '));
            }
        });
    }

    var setCardLabel = function(tc, argv) {
        assertArgument(argv.c, '-c <CARD-ID> not provided.');
        assertArgument(argv.l, '-l <LABEL-ID> not provided.');
        get(tc, '/1/cards/' + argv.c).then((card) => {
            console.log('-- ' + card.id + ' => \'' + card.name + '\'');
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
            lastListId = data[data.length - 1].id;
            return get(tc, '/1/boards/' + argv.b + '/cards', {
                limit: 1000,
                filter: 'closed'
            });
        }).then((cards) => {
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
                    console.log('--- ' + data.vars.listName.toUpperCase());
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
                        var state = card.closed ? "[CLOSED]" : "[OPEN]";
                        console.log('    + ' + state + ' ' +
                            card.name.substring(0, 80));
                    }
                });
            }
        });
    }

    // -----------------------------------------------------------------------
    return {
        getRaw: getRaw,
        getBoardIds: getBoardIds,
        getLabels: getLabels,
        getCardLabels: getCardLabels,
        setCardLabel: setCardLabel,
        moveClosedCardToLastList: moveClosedCardToLastList,
        getBoardStructure: getBoardStructure,
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
