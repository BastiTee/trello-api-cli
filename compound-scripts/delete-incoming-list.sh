#!/bin/bash
cd "$( dirname "$( readlink -f "$0")")"
cd ..
cli="./trello-api-cli"
# get first non-welcome board id 
bid=$( $cli getBoardIds 2> /dev/null | grep -iv "willkommen" |\
awk '{print $1}' )
# get list of board with incoming in title 
lid=$( $cli getBoardLists -b $bid 2> /dev/null | grep -i "incoming" |\
head -n1 | awk '{print $1}' )
# get cards from list 
$cli getCardsOfList -l $lid 