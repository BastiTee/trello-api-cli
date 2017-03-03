#!/bin/bash
cd "$( dirname "$( readlink -f "$0")")"
cd ..

cli="./trello-api-cli"

$cli getCardStatistics -b 573c0f02b5a961fc1559ab3e -f "2017-1-01" -t "2017-02-01"

boardid=$( \
$cli getBoardIds 2> /dev/null |\
grep -iv -e "willkommen" -e "welcome" | head -n1 | awk '{ print $1 }' )
[ -z $boardid ] && { echo "-- failed."; exit 1; }
clabel=$( $cli getCardLabels -b $boardid -l 1 2> /dev/null |\
 sed -r -e "s/\"[^\"]+\"//" )
cid=$( awk '{ print $1 }' <<< $clabel )
labid=$( awk '{ print $2 }' <<< $clabel )
[ -z $cid ] || [ -z $labid ] && { echo "-- failed."; exit 1; }
$cli setCardLabel -c $cid -l $labid && \
$cli getRaw -p "/1/members/me" && \
$cli getLabels -b $boardid && \
$cli moveClosedCardToLastList -b $boardid && \
$cli getBoardStructure -b $boardid && \
echo "-- ok."
