#!/bin/bash
cd "$( dirname "$( readlink -f "$0")")"
cd ..

# get first non-welcome board
boardid=$( \
./trello-api-cli getBoardIds 2> /dev/null |\
grep -iv -e "willkommen" -e "welcome" | head -n1 | awk '{ print $1 }' )

# get all labels and names and create sed patterns
tmpf=$( mktemp )
./trello-api-cli getLabels -b $boardid 2> /dev/null > $tmpf
sed="sed -r "
while read line
do
    id=$( awk '{ print $1 }' <<< $line )
    name=$( awk '{ print $2 }' <<< $line | tr -d "\"" )
    sed="${sed}-e 's/$id/$name/g' "
done < $tmpf
rm $tmpf

# get all open or closed cards
tmpf=$( mktemp )
./trello-api-cli getCardLabels -b $boardid -l 1000 2> /dev/null > $tmpf
eval $sed $tmpf
