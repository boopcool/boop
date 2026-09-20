#!/bin/sh
# Wrapper so the preview launcher gets Node on PATH regardless of how it
# invokes the command. Plain `npm run dev` works in a normal shell.
NODE_BIN="$HOME/.local/node24/bin"
if [ -d "$NODE_BIN" ]; then
  PATH="$NODE_BIN:$PATH"
  export PATH
fi
exec npm run dev -- "$@"
