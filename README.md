# DVIoT (Damn Vulnerable Internet of Things)

DVIoT is a cyber security training program with an IoT theme. Simular to applications like DVWA (Damn Vulnerable Web App) the program has many security bugs built into it. Download the program, setup the server, and try to find these bugs/logic errors and exploit them to your benifit!

## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

```
node.js + npm
mongodb (up and running)
```

### Installing

Install the dependencies:
```
npm install
```

Setup the database:
```
node setup.js
```

Run the application:
```
node server.js
```

### Configurations

Users can adjust the difficulty of the program at any time by editing the 'difficulty' value in config.js.
```
0 = easy
1 = hard
```