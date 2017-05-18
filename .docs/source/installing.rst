Installing Genebook
*******************

Genebook is a Meteor.js_ application at its core. This means it is completely written in javascript. It requires Node.js_, MongoDB_ and ofcourse Meteor itself.

Installing this on a Mac is as easy as:

.. code-block:: bash

	brew install mongodb
	brew install node
	curl https://install.meteor.com/ | sh
	git clone https://github.com/holmrenser/genebook

Check this_ if you run into npm user persission problems.

The following will let you run a development version on your local machine:

.. code-block:: bash

	meteor

While the app is running you can run the following script to load some example data:

.. code-block:: bash

	bash scripts/load_testdata.sh

*Information on compiling a full standalone build will be added soon*


.. _Meteor.js: https://www.meteor.com/
.. _MongoDB: https://www.mongodb.com/
.. _Node.js: https://nodejs.org/
.. _this: https://docs.npmjs.com/getting-started/fixing-npm-permissions/