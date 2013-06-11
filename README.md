mtcp
=====
`mtcp` module for disperse your network transfer over multi sockets, thus improve network speed if you get per-connection speed limit. Otherwise you will too soon comsume too many connections and can not connect any more.

`mtcp` module was originally forked from `wsmlby/mtcp`, with several patches to make it easier to use and stable.

## usage
--------
mtcp will forward  a remote port on a server to a local port on your machine via multi sockets:

```
Applications <--> local:local_port <-- multi sockets --> host:host_port <--> host:remote_port
```
Now you can use `local_port` on your machine as using `remote_port` on a server.

For example, you can open a ssh tunnel on you server (ssh to localhost), then use mtcp to forward it to your local machine, and now get a socks5 proxy at localhost:local_port.


setup
----------------
#### configuration

This module is still under development. You must provide a `config.json` at mtcp directory:

```
{
    "host":"you_host",
    "host_port":"host_port",
    "remote_port":"remote_port",
    "local_port":"local_port",
    "somaxconn":10
}

```

`host` has been tested against IPv6 **only**.
`host_port` is used by mtcp itself.


Right now mtcp will create `somaxconn` sockets for a single connections. So you would like to increase your max files open limit and max tcp connection limit on both server and client.

### increase max connection limit

#### Linux

edit `/etc/security/limits.conf` and add lines like

```
username	soft	nofile	65535
username	hard	nofile	65535

```

To change limits for any user(except root), you could replace username with *, but you must specify `root` for changing limits for root user.

You may also want to add something like `ulimit -n 10240` to your /etc/profile

#### change max cocurrent connection

use `sudo sysctl -w net.core.somaxconn=65535` 


#### OS X

##### increate max open files

    $ sysctl -a | grep files
    kern.maxfiles = 12288
    kern.maxfilesperproc = 10240

##### kern.maxfiles and kern.maxfilesperproc were small numbers, they need to be increased:

    $ sudo sysctl -w kern.maxfiles=12288
    $ sudo sysctl -w kern.maxfilesperproc=10240

after this, you can increase your account’s limit by ulimit -n:

    $ ulimit -n 10240

increate max sockets

    $ sysctl -a | grep somax
    kern.ipc.somaxconn: 2048

and

    $ sudo sysctl -w kern.ipc.somaxconn=2048


You may also want to add something like `ulimit -n 10240` to your /etc/profile



#### Windows
you may open a wrong url by accident


Port Forwarding
----------------
use 

	node local.js


on client (the host you can access)

and 

	node server.js

on server (the other end).

# Known issues
This module is not stable yet. 

Right now `mtcp` has some bugs causing memory leaks. If you can help, feel free to send pull requests.

`mtcp` will release unused sockets for a timeout. So it may hold many sockets at the same time (maybe thousands). It will release them after a period of time. I hope this could be fixed soon.

`mtcp` disperse data and re-assemble then on remote server. So it would comsume much CPU time if you set a big value for `somaxconn`, and won't increase speed any more.

# Warnning
Don't abuse this package to get much more bandwidth than yourself need like massive downloading or provide service to others.

# License 

(MIT)




