#!/bin/bash
cd "$( dirname "$( readlink -f "$0")")"
cd ..

# check input
if [ -z "$1" ] || [ ! -f "$1" ]; then
cat << EOF
No input file set. Must be a non-header plain-text file of form
<CARD-ID> <CARD-LABEL-NAME> (per line).
Script will skip all lines where either card or card label does not exist for board.
EOF
exit 1
fi

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
    sed="${sed}-e 's/$name/$id/g' "
done < $tmpf
rm $tmpf

eval "$sed $1" | while read line; do
    # TODO filter out garbage
    [ ! -z "$line" ] && echo $line
done

echo "^ BOARD ID | ^ CARD ID | ^ LABEL ID"
read -p "Does that look ok? Shall I overwrite card labels? (y/n) " -n 1 -r
echo "" # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

eval "$sed $1" | while read line; do
    [ -z "$line" ] && continue
    id=$( awk '{ print $1 }' <<< $line )
    labelid=$( awk '{ print $2 }' <<< $line )
    ./trello-api-cli setCardLabel -c $id -l $labelid
    #2> /dev/null
done
