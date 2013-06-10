mtcp
=====

mtcp module for disperse your network transfer over multi sockets, thus improve network speed if you get per-connection speed limit.

usage
--------

setup
----------------

Right now mtcp will create 20 sockets for a single connections. So you would like to increase your max files open limit and max tcp connection limit on both server and client.

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


for socket forwarding
----------------
use 

	node test/test.js localport:remoteaddress:remoteport


on client(the host you can access)

and 

	node test/test2.js localport:remoteaddress:remoteport

on server(the other end).

You should manually edit `host` on test.js to get all things work.




