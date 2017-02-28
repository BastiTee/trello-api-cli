# trello-api-cli

> A command-line wrapper for the trello API written in node.js

This is a simple command-line wrapper for the [Trello API](https://developers.trello.com/) written in node.js and utilizing [node-trello](https://github.com/adunkman/node-trello). The full API reference can be found [here](https://developers.trello.com/advanced-reference).

## Setup

Just run download the code or clone the repository and run ..

```
./trello-api-cli
```

On a mint system, this will first install dependencies with npm and execute the CLI tool. First time it'll break with

```
WARNING: Could not read ~/.trello-public-token file. Create it and store your public api key inside.
```

You can get your public API token [here](https://trello.com/app-key). This must go into the file mentioned in the warning. Run the script again and it'll guide you through a browser-based process to obtain a secret API key to connect to a Trello-user's content via the API.

Alternatively you can just create both files `<userhome>/.trello-public-token` and `<userhome>/.trello-secret-token` manually having the respective keys available.

## Usage

You can either run API endpoints directly

```
./trello-api-cli getRaw -p "/1/members/me/boards"
```

or run the predefined compound methods that are listed on startup.

```
./trello-api-cli getBoardIds
```

If you just want to print out the payload without the CLI's informational output, pipe the error output to /dev/null like

```
./trello-api-cli getBoardIds 2>/dev/null
```

## License

This code is licensed under [MIT](LICENSE).
