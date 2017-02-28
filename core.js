tsCore = function() {
    "use strict";

    var getRaw = function(tc, argv) {
        assertArgument(argv.p, "-p <API-PATH> not provided.")
        tc.get(argv.p, function(err, data) {
            handleError(err);
            console.log(data);
        });
    }

    var getBoardIds = function(tc, argv) {
        tc.get('/1/members/me/boards', function(err, data) {
            handleError(err);
            for (var board of data) {
                console.log(board.id + " \"" + board.name + "\"");
            }
        });
    }

    var getLabels = function(tc, argv) {
        assertArgument(argv.b, "-b <BOARD-ID> not provided.")
        console.error("<<LABEL-ID>> <<LABEL-NAME>>");
        tc.get('/1/boards/' + argv.b + '/labels', function(err, data) {
            handleError(err);
            for (var board of data) {
                console.log(board.id + " \"" + board.name + "\"");
            }
        });
    }

    var getCardLabels = function(tc, argv) {
        assertArgument(argv.b, "-b <BOARD-ID> not provided.")
        assertArgument(argv.l, "-l <LIMIT> not provided.")
        console.error("<<CARD-ID>> <<CARD-DESC>> <<ID-LABEL-1>> .. <<ID-LABEL-N>>");
        tc.get('/1/boards/' + argv.b + '/cards', {
            limit: argv.l,
            filter: "all",
        }, function(err, data) {
            handleError(err);
            for (var card of data) {
                card.name = card.name.split("\"").join("");
                console.log(card.id + " \"" + card.name + "\" " + card.idLabels.join(" "));
            }
        });
    }


    // -----------------------------------------------------------------------
    return {
        getRaw: getRaw,
        getBoardIds: getBoardIds,
        getLabels: getLabels,
        getCardLabels: getCardLabels,
    };
    // -----------------------------------------------------------------------

    function assertArgument(arg, message) {
        if (arg === undefined) {
            console.error(message);
            process.exit(1);
        }
    }

    function handleError(err) {
        if (err) {
            console.log("ERROR: " + err);
            process.exit(1);
        }
    }
}();
