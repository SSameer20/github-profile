still the POST /publish/readme as the publish endpoint.
is not working well giving me w=error {"error":"Not Found"}

so I wnat to debug actual flow is the it should commit to {username}/{username}/README.md file

### acceptance criteria

- user should able to commit at `{username}/{username}`
- README of the repo should update with the profule generated

### debug notes

- Backend publish flow now logs repository lookup, repository creation, README lookup, and commit result.
- Frontend commit flow now records the commit request and failure/success state in the session log.

## server logs

[publish/readme] target repository {
owner: 'SSameer20',
repo: 'SSameer20',
commitPath: 'SSameer20/README.md',
message: 'Update README'
}
[publish/readme] repository exists { owner: 'SSameer20', repo: 'SSameer20', branch: 'main' }
[publish/readme] existing README lookup {
owner: 'SSameer20',
repo: 'SSameer20',
branch: 'main',
found: true,
status: 200
}
[publish/readme] commit failed {
owner: 'SSameer20',
repo: 'SSameer20',
branch: 'main',
status: 404,
message: 'Not Found'
}
[publish/readme] request received { sub: 'cmrjhnsyc0000ahugnl8npasr' }
[publish/readme] target repository {
owner: 'SSameer20',
repo: 'SSameer20',
commitPath: 'SSameer20/README.md',
message: 'Update README'
}
[publish/readme] repository exists { owner: 'SSameer20', repo: 'SSameer20', branch: 'main' }
[publish/readme] existing README lookup {
owner: 'SSameer20',
repo: 'SSameer20',
branch: 'main',
found: true,
status: 200
}
[publish/readme] commit failed {
owner: 'SSameer20',
repo: 'SSameer20',
branch: 'main',
status: 404,
message: 'Not Found'
}

## diagnosis from logs

- The repo exists and the README can be read, so the failure is not a missing `POST /publish/readme` route.
- The commit write still returns GitHub `404`, which is consistent with a stale OAuth token that does not have the new `repo` permission.
- The backend now checks the stored token scope and returns a clear reconnect error when `repo` access is missing.
- The server log confirms the stored scope is `read:user,user:email`, so the existing session must be disconnected and reconnected to receive a new token with `repo` access.
- The frontend now surfaces a reconnect action when this scope error is returned.

### server logs

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
[publish/readme] request received { sub: 'cmrjhnsyc0000ahugnl8npasr' }
[publish/readme] github account scope {
login: 'SSameer20',
scope: 'read:user,user:email',
tokenType: 'bearer'
}
[publish/readme] missing repo scope, reconnect required { login: 'SSameer20', scope: 'read:user,user:email' }
