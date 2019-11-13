#!/usr/bin/env node

var revelation = require('./')
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
    alias: { port: 'p', host: 'h', server: 's', domain: 'd' }
})

var rcvd = {}
var cmd = argv._[0]
var rev = revelation(argv)

if (cmd === 'listen') {
    rev.listen(argv.port, onlisten)
    if (argv.diag) {
        var diagServer = require('./diagnostics-server').createServer(rev, { password: argv.diagpw })
        diagServer.listen((typeof argv.diag === 'number' ? argv.diag : 3030), ondiaglisten)
    }
} else if (cmd === 'lookup') {
    rev.on('peer', onpeer)
    lookup()
    setInterval(lookup, 1000)
} else if (cmd === 'announce') {
    if (!argv.port) throw new Error('You need to specify --port')
    announce()
    setInterval(announce, 1000)
} else {
    console.error(
        'ddns [command]\n' +
        '  announce [name]\n' +
        '    --port=(port)\n' +
        '    --host=(optional host)\n' +
        '    --server=(optional revelation server)\n' +
        '    --domain=(optional authoritative domain)\n' +
        '  lookup [name]\n' +
        '    --server=(optional revelation server)\n' +
        '    --domain=(optional authoritative domain)\n' +
        '  listen\n' +
        '    --port=(optional port)\n' +
        '    --ttl=(optional ttl in seconds)\n' +
        '    --domain=(optional authoritative domain)\n' +
        '    --diag=(enable diagnostic server, optional port, default 3030)\n' +
        '    --diagpw=(optional password for diagnostic server)'
    )
    process.exit(1)
}

function lookup() {
    rev.lookup(argv._[1])
}

function announce() {
    rev.announce(argv._[1], argv.port)
}

function onpeer(name, peer) {
    var addr = peer.host + ':' + peer.host
    if (rcvd[addr]) return
    rcvd[addr] = true
    console.log(name, peer)
}

function onlisten(err) {
    if (err) throw err
    console.log('Server is listening on port %d', argv.port || 53)
}

function ondiaglisten(err) {
    if (err) throw err
    console.log('Diagnostics server is listening on port %d', (typeof argv.diag === 'number' ? argv.diag : 3030))
}