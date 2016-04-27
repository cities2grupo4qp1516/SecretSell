secretSale.constant('config', {
    URLSSS: "http://localhost:3000/"
    , URLTTP: "http://localhost:3000/"
});

secretSale.controller("objetosController", function ($scope, $http, config) {
    $scope.subirObjeto = function () {
        console.log($scope.objeto);
        $http.post(config.URLTTP + 'objetos/nuevo', $scope.objeto)
            .success(function (data) {

            })
            .error(function (dataa) {
                console.log('Error: ' + dataa + "");
            });
    }
});

secretSale.controller("clienteController", function ($scope, $http, config) {
    var paisfinal;
    var generofinal;
    var cliente = {};

    $scope.showSelectValue1 = function (genero) {
        console.log(genero)
        generofinal = genero;

    }

    $scope.showSelectValue2 = function (pais) {
        console.log(pais)
        paisfinal = pais;
    }

    $scope.registrarUsuario = function () {
        cliente = {
            nick: $scope.cliente.nick
            , nombre: $scope.cliente.nombre
            , apellidos: $scope.cliente.apellidos
            , password: $scope.cliente.password
            , mail: $scope.cliente.mail
            , edad: $scope.cliente.edad
            , pais: paisfinal
            , genero: generofinal
        }
        $http.post(config.URLTTP + 'users/usuarios', cliente)
            .success(function (data) {

            })
            .error(function (dataa) {
                console.log('Error: ' + dataa + "");
            });
    }
});

secretSale.controller("RegVendedorController", function ($scope, UtilSrvc, $http, config, BigInteger, rsaKey) {
    $scope.cif = "";
    $scope.pseudonimo = "";
    $scope.ok = false;
    $scope.error = false;
    $scope.seudo = false;
    $scope.seudonimo = "";
    var publickey = {
        bits: ""
        , n: ""
        , e: ""
    };

    $http.get(config.URLTTP + 'firma_ciega/publicKey')
        .success(function (data) {
            publickey = {
                bits: data.bits
                , n: data.n
                , e: data.e
            };



        })
        .error(function (data) {
            console.log('Error: ' + data);

        });


    $scope.validar = function () {

        if ($scope.cif.length < 8) {
            $scope.error = true;


        } else if ($scope.cif.length == 8) {
            $scope.ok = true;
            $scope.error = false;
            $scope.seudo = true;
        }
    };

    $scope.enviar = function (seudonimo) {

        var seudohash = sha256(seudonimo);
        var hash = {
            hash: seudohash
        };

        console.log("HASH: " + seudohash);
        var diff = Decimal.sub(Decimal.pow(2, publickey.bits), Decimal.pow(2, publickey.bits - 1));
        var randomNumber = Decimal.add((Decimal.mul(Decimal.random(300), Decimal.pow(2, publickey.bits)).round()), diff);
        var r = new BigInteger(randomNumber.toString());

        console.log("R: " + r);

        var m = new BigInteger(hash.hash, 16);
        var e = new BigInteger(publickey.e);
        var n = new BigInteger(publickey.n);
        var bc = m.multiply(r.modPow(e, n)).mod(n);

        var blindMsg = {
            blind: bc.toString(10)
        };
        console.log('blind msg   m·r^e mod n:', '\n', blindMsg.blind.toString(10), '\n');

        $http.post(config.URLTTP + 'firma_ciega', JSON.stringify(blindMsg))
            .success(function (data) {
                /*
                c = bc.multiply(r.modInverse(n));
                console.log('(unblinded) valid encryption    *1/r mod n:', '\n', c.toString(), '\n');

                d = keys.publicKey.decrypt(c);
                //EL CONSOLE.LOG SIGUIENTE TAMPOCO FUNCIONA//
                console.log('decryption with public:', '\n', d.toString(), '\n');*/
                var teta = new BigInteger(data.teta);
                var c = teta.multiply(r.modInverse(n)).mod(n);
                var publicKeyTTP = new rsaKey.publicKey(publickey.bits, n, e);
                console.log(publicKeyTTP);

                var d = publicKeyTTP.decrypt(c);

                console.log("DESPUES DE FIRMA: " + d.toString(16));

            })
            .error(function (dataa) {
                console.log('Error: ' + dataa);

            });

    };

})

.controller("MyCtrl2", function ($scope) {

    }).factory('rsaKey', ['BigInteger', 'primeNumber', function (BigInteger, primeNumber) {
        var rsa = {
            publicKey: function (bits, n, e) {
                this.bits = bits;
                this.n = n;
                this.e = e;
            }
            , privateKey: function (p, q, d, publicKey) {
                this.p = p;
                this.q = q;
                this.d = d;
                this.publicKey = publicKey;
            }
            , importKeys: function (impotedKeys) {
                var keys = {};
                impotedKeys.privateKey.publicKey.e = new BigInteger(impotedKeys.privateKey.publicKey.e);
                impotedKeys.privateKey.publicKey.n = new BigInteger(impotedKeys.privateKey.publicKey.n);
                keys.publicKey = new rsa.publicKey(impotedKeys.publicKey.bits, new BigInteger(impotedKeys.publicKey.n), new BigInteger(impotedKeys.publicKey.e));
                keys.privateKey = new rsa.privateKey(new BigInteger(impotedKeys.privateKey.p), new BigInteger(impotedKeys.privateKey.q), new BigInteger(impotedKeys.privateKey.d), impotedKeys.privateKey.publicKey);
                return keys;
            }
            , generateKeys: function (bitlength) {
                var p, q, n, phi, e, d, keys = {}
                    , one = new BigInteger('1');
                this.bitlength = bitlength || 2048;
                console.log("Generating RSA keys of", this.bitlength, "bits");
                p = primeNumber.aleatorio(bitlength);
                do {
                    q = primeNumber.aleatorio(bitlength);
                } while (q.compareTo(p) === 0);
                n = p.multiply(q);

                phi = p.subtract(one).multiply(q.subtract(one));

                e = new BigInteger('65537');
                d = e.modInverse(phi);

                keys.publicKey = new rsa.publicKey(this.bitlength, n, e);
                keys.privateKey = new rsa.privateKey(p, q, d, keys.publicKey);
                return keys;
            }
            , String2bin: function (str) {
                var bytes = [];
                for (var i = 0; i < str.length; ++i) {
                    bytes.push(str.charCodeAt(i));
                }
                return bytes;
            }
            , bin2String: function (array) {
                var result = "";
                for (var i = 0; i < array.length; i++) {
                    result += String.fromCharCode(array[i]);
                }
                return result;
            }
        };


        rsa.publicKey.prototype = {
            encrypt: function (m) {
                return m.modPow(this.e, this.n);
            }
            , decrypt: function (c) {
                return c.modPow(this.e, this.n);
            }
            , dec: function (c, pass, passs) {
                return c.modPow(pass, passs);
            }
        };

        rsa.privateKey.prototype = {
            encrypt: function (m) {
                return m.modPow(this.d, this.publicKey.n);
            }
            , decrypt: function (c) {
                return c.modPow(this.d, this.publicKey.n);
            }
        };
        return rsa;
}])
    .factory('primeNumber', ['BigInteger', function (BigInteger) {
        Decimal.config({
            precision: 300
            , rounding: 4
            , toExpNeg: -7
            , toExpPos: 100
            , maxE: 9e15
            , minE: -9e15
        });
        var primo = {
            aleatorio: function (bitLength) {
                var isPrime = false;
                var diff = Decimal.sub(Decimal.pow(2, bitLength), Decimal.pow(2, bitLength - 1));
                while (!isPrime) {
                    var randomNumber = Decimal.add((Decimal.mul(Decimal.random(300), Decimal.pow(2, bitLength)).round()), diff);
                    var rnd = new BigInteger(randomNumber.toString());
                    if (rnd.isProbablePrime(3)) {
                        isPrime = true;
                    }
                }
                return rnd;
            }
        };
        return primo;
}]);