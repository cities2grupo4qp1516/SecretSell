secretSale.constant('config', {
    URLSSS: "https://localhost:3000/",
    URLTTP: "https://localhost:5000/"
});

secretSale.controller("listaObjetos", function ($rootScope, $scope, $http, config, $cookies, $state) {
    $scope.lista = {};

    $scope.anadirProducto = function (a, b, c) {
        $rootScope.cart.totalProductos++;
        $rootScope.cart.total += a;

        var pos2 = $rootScope.cart.productos.map(function (e) {
            return e.nombre;
        }).indexOf(b);

        if ($rootScope.cart.productos[pos2] == undefined) {
            $rootScope.cart.productos[b] = true;
            $rootScope.cart.productos.push({
                nombre: b,
                precio: a,
                url: c,
                cantidad: 1
            });
            //$rootScope.cart.productos.length++;
        } else {
            var pos = $rootScope.cart.productos.map(function (e) {
                return e.nombre;
            }).indexOf(b);
            $rootScope.cart.productos[pos].cantidad++;
        }
        console.log($rootScope.cart.productos);
        $cookies.putObject("cart", $rootScope.cart);
    }

    //../imagenes/
    $http.get(config.URLSSS + "objetos/filtro/").success(function (data) {
        console.log(data);
        var d = data;
        /*angular.forEach(d, function (value, key) {
            console.log(value.fotoprincipal);
            d[key].fotoprincipal = "../" + d[key].fotoprincipal;
        });*/
        $scope.lista = d;
        console.log($scope.lista);
    }).error(function (data) {
        console.log(data);
    });

    $scope.verObjeto = function (a) {
        $state.go("/descripcion", {
            objectName: a
        });
    }
})

.controller("descripcionController", function ($cookies, $rootScope, $scope, $http, config, Base64, rsaKey, BigInteger, SweetAlert, $stateParams) {
    $http.get(config.URLSSS + "objetos/filtro/?nombre=" + $stateParams.objectName).success(function (data) {
        console.log(data[0]);
        $scope.objeto = data[0];

    }).error(function (data) {
        console.log(data);
    });

    $scope.enviarComentario = function () {
        var objeto = {
            comentarios: [{
                nick: $cookies.getObject("token").nick,
                comentario: {
                    puntuacion: $scope.nota,
                    descripcion: $scope.comentario
                }
            }]
        }

        console.log(objeto);
        $http.post(config.URLSSS + 'users/buy/' + $stateParams.objectName, objeto).success(function (data) {
            console.log(data);
        }).error(function (data) {
            console.log(data);
        });
    }
})

.controller("vendedorController", function ($rootScope, $scope, $http, config, Base64, rsaKey, BigInteger, SweetAlert, $injector, $cookies, $state) {
    var paisfinal;
    var generofinal;
    var foto;
    $scope.ojo = false;
    $scope.cliente = {};

    $scope.showSelectValue1 = function (genero) {
        console.log(genero)
        generofinal = genero;

    }

    $scope.showSelectValue2 = function (pais) {
        console.log(pais)
        paisfinal = pais;
    }

    $scope.fotoVer = function () {
        SweetAlert.swal({
                title: "Esta es tu foto",
                text: "<img src='" + foto + "'>",
                html: true
            },
            function () {});
    }

    $scope.file_changed = function (element) {
        $scope.ojo = true;

        $scope.$apply(function (scope) {
            var photofile = element.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                foto = e.target.result;
            };
            reader.readAsDataURL(photofile);
        });
    };

    $scope.registrarUsuario = function () {
        console.log("Estoy dentro");
        var fd = new FormData();
        var passhash = sha256($scope.cliente.password);
        fd.append('nick', $scope.cliente.nick);
        fd.append('nombre', $scope.cliente.nombre);
        fd.append('apellidos', $scope.cliente.apellidos);
        fd.append('password', passhash);
        fd.append('mail', $scope.cliente.mail);
        fd.append('edad', $scope.cliente.edad);
        fd.append('pais', paisfinal);
        fd.append('genero', generofinal);
        fd.append('file', $scope.foto);

        $http.post(config.URLSSS + 'users/usuarios', fd, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data) {
            SweetAlert.swal({
                    title: "Registro completado con éxito!",
                    type: "success",
                    confirmButtonText: "Continuar",
                },
                function () {
                    $state.go("/login_vendedor");
                });
        }).error(function (data) {
            console.log(data);
            sweetAlert("Oops...", data, "error");
        });
    }

    var certificado = {},
        keys;
    $scope.si = false;
    $scope.form1 = true;
    $scope.form2 = false;
    $scope.u = false;
    $scope.p = false;


    $scope.aa = true;
    $scope.bb = false;
    $scope.lol = function () {
        $scope.aa = false;
        $scope.bb = true;
    }
    $scope.sujeto = "desconocido";
    jQuery("input#imgInp").change(function () {
        var files = document.getElementById('imgInp').files;
        var reader = new FileReader();
        reader.readAsText(files[0]);

        reader.onloadend = function () {
            $rootScope.callaPuta = reader.result;
        };
        $scope.$apply(function () {
            $scope.si = true;
        });
    });

    $scope.subirObjeto = function () {
        var fileKeys = JSON.parse(Base64.decode($rootScope.callaPuta));
        console.log(rc4($scope.passVenPid, Base64.decode(fileKeys.d)));
        var estaPutaMierdaMeEstaSacandoDeMisCasillas = rc4($scope.passVenPid, Base64.decode(fileKeys.d));
        certificado = {
            e: fileKeys.e,
            firma: fileKeys.firma,
            n: fileKeys.n,
            seudonimo: fileKeys.seudonimo
        }

        keys = rsaKey.importKeys({
            privateKey: {
                publicKey: {
                    e: fileKeys.e,
                    n: fileKeys.n
                },
                p: estaPutaMierdaMeEstaSacandoDeMisCasillas,
                q: estaPutaMierdaMeEstaSacandoDeMisCasillas,
                d: estaPutaMierdaMeEstaSacandoDeMisCasillas
            },
            publicKey: {
                bits: 1024,
                n: fileKeys.n,
                e: fileKeys.e
            }
        })
        console.log(keys);
        $http.post(config.URLSSS + "users/vendedor/", certificado).success(function (data) {
            console.log(keys.privateKey.decrypt(new BigInteger(data)).toString());
            var aCamachoNoSeLeMientePeroAFritoDaIgual = {
                nounce: keys.privateKey.decrypt(new BigInteger(data)).toString(),
                seudo: certificado.seudonimo
            }
            $http.post(config.URLSSS + "users/nounce/", aCamachoNoSeLeMientePeroAFritoDaIgual).success(function (data) {
                console.log(data);
                $scope.form1 = false;
                $scope.form2 = true;
                $scope.sujeto = certificado.seudonimo;
            }).error(function (data) {
                console.log(data);
            });
        }).error(function (data) {
            console.log(data);
        });
    }
    $scope.pass = function () {
        var venendro = {
            nick: certificado.seudonimo,
            password: sha256($scope.passw)
        }
        $http.post(config.URLSSS + "users/regi/", venendro).success(function (data) {
            SweetAlert.swal({
                    title: "Registro completado con éxito!",
                    type: "success",
                    confirmButtonText: "Continuar",
                },
                function () {
                    $state.go("/login_vendedor");
                });
        }).error(function (data) {
            console.log(data);
        });
    }

    $scope.display = function (n, p) {



        if (n > 0) {
            $scope.n = false;
        }
        if (p > 0) {
            $scope.p = false;
        }


    };

    $scope.login = function () {
        $scope.n = false;
        $scope.p = false;
        if ((!$scope.nick) && (!$scope.passw)) {
            $scope.n = true;
            $scope.p = true;

        } else if (!$scope.nick) {

            $scope.n = true;
        } else if (!$scope.passw) {
            $scope.p = true;

        } else {
            var venendro = {
                nick: $scope.nick,
                password: sha256($scope.passw),
                tipo: "vendedor"

            }
            $http.post(config.URLSSS + "users/login/", venendro).success(function (data) {
                /*En data se puede ver el token*/
                console.log(data);
                $cookies.putObject("token", data);
                SweetAlert.swal({
                        title: "Login completado con éxito!",
                        type: "success",
                        confirmButtonText: "Continuar",
                    },
                    function () {
                        $state.go("/");
                    });
                /*En esta parte pongo de ejemplo como añadir en la cabecera de la peticion la autenticacion con token */
                $http({
                    method: 'GET',
                    url: config.URLSSS + "users/prueba/",
                    headers: {
                        'Authorization': 'Bearer ' + data.token
                    }
                }).success(function (data) {
                    console.log(data);
                }).error(function (data) {
                    console.log(data);
                });
            }).error(function (data) {
                console.log(data);
                SweetAlert.swal({
                        title: data,
                        type: "error",
                        confirmButtonText: "Continuar",
                    },
                    function () {
                        console.log("weee");
                    });

            });
        }
    }
    $scope.loginc = function () {
        $scope.n = false;
        $scope.p = false;
        if ((!$scope.nickc) && (!$scope.passwc)) {
            $scope.n = true;
            $scope.p = true;

        } else if (!$scope.nickc) {

            $scope.n = true;
        } else if (!$scope.passwc) {
            $scope.p = true;

        } else {
            var venendro = {
                nick: $scope.nickc,
                password: sha256($scope.passwc),
                tipo: "cliente"
            }
            $http.post(config.URLSSS + "users/login/", venendro).success(function (data) {
                /*En data se puede ver el token*/
                console.log(data);
                $cookies.putObject("token", data);
                SweetAlert.swal({
                        title: "Login completado con éxito!",
                        type: "success",
                        confirmButtonText: "Continuar",
                    },
                    function () {
                        $state.go("/");
                    });
                /*En esta parte pongo de ejemplo como añadir en la cabecera de la peticion la autenticacion con token */
                $http({
                    method: 'GET',
                    url: config.URLSSS + "users/prueba/",
                    headers: {
                        'Authorization': 'Bearer ' + data.token
                    }
                }).success(function (data) {

                    console.log(data);
                }).error(function (data) {
                    console.log(data);

                });
            }).error(function (data) {
                console.log(data);
                SweetAlert.swal({
                        title: data,
                        type: "error",
                        confirmButtonText: "Continuar",
                    },
                    function () {
                        console.log("weee");
                    });
            });
        }
    }
})

.controller("objetosController", function ($rootScope, $scope, $http, config, SweetAlert, $injector) {
    $scope.objeto = {};
    var foto;
    $scope.ojo = false;
    var $validationProvider = $injector.get('$validation');


    $scope.fotoVer = function () {
        //sweetAlert("Esta es tu foto", "<img src=''>");
        SweetAlert.swal({
                title: "Esta es tu foto",
                text: "<img src='" + foto + "'>",
                html: true
            },
            function () {});
    }
    $scope.file_changed = function (element) {
        $scope.ojo = true;

        $scope.$apply(function (scope) {
            var photofile = element.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                // handle onload
                // no no no nooooooo console.log(e.target.result);
                foto = e.target.result;
            };
            reader.readAsDataURL(photofile);
        });
    };

    $scope.subirObjeto = function () {
        var fd = new FormData();
        fd.append('nombre', $scope.objeto.nombre);
        fd.append('descripcion', $scope.objeto.descripcion);
        fd.append('vendedor', $scope.objeto.vendedor);
        fd.append('precio', $scope.objeto.precio);
        fd.append('tipo', $scope.objeto.tipo);
        fd.append('file', $scope.foto);
        console.log(fd);
        $http.post(config.URLSSS + "objetos/nuevo/", fd, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data) {
            SweetAlert.swal({
                    title: "Producto añadido correctamente",
                    type: "success",
                    confirmButtonText: "Continuar",
                },
                function () {
                    console.log("weee");
                });
        }).error(function (data) {
            console.log(data);
            sweetAlert("Oops...", data, "error");
        });
    }
})

.controller("clienteController", function ($rootScope, $scope, $http, config, SweetAlert, $injector) {
    var paisfinal;
    var generofinal;
    var foto;
    $scope.ojo = false;
    $scope.cliente = {};

    $scope.showSelectValue1 = function (genero) {
        console.log(genero)
        generofinal = genero;

    }

    $scope.showSelectValue2 = function (pais) {
        console.log(pais)
        paisfinal = pais;
    }

    $scope.fotoVer = function () {
        SweetAlert.swal({
                title: "Esta es tu foto",
                text: "<img src='" + foto + "'>",
                html: true
            },
            function () {});
    }

    $scope.file_changed = function (element) {
        $scope.ojo = true;

        $scope.$apply(function (scope) {
            var photofile = element.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                foto = e.target.result;
            };
            reader.readAsDataURL(photofile);
        });
    };

    $scope.registrarUsuario = function () {
        console.log("Estoy dentro");
        var fd = new FormData();
        var passhash = sha256($scope.cliente.password);
        fd.append('nick', $scope.cliente.nick);
        fd.append('nombre', $scope.cliente.nombre);
        fd.append('apellidos', $scope.cliente.apellidos);
        fd.append('password', passhash);
        fd.append('mail', $scope.cliente.mail);
        fd.append('edad', $scope.cliente.edad);
        fd.append('pais', paisfinal);
        fd.append('genero', generofinal);
        fd.append('file', $scope.foto);

        $http.post(config.URLSSS + 'users/usuarios', fd, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data) {
            SweetAlert.swal({
                    title: "Registro completado con éxito!",
                    type: "success",
                    confirmButtonText: "Continuar",
                },
                function () {
                    console.log("weee");
                });
        }).error(function (data) {
            console.log(data);
            sweetAlert("Oops...", data, "error");
        });
    }
})

.controller("cartController", function ($rootScope, $scope, $http, config, $cookies) {

    $scope.borrarEstaMierda = function (a) {
        console.log(a);
        var pos2 = $rootScope.cart.productos.map(function (e) {
            return e.nombre;
        }).indexOf(a);
        $rootScope.cart.productos.splice(pos2, 1);
        //$rootScope.cart.productos.splice(a, 1);
        $cookies.putObject("cart", $rootScope.cart);
        console.log($rootScope.cart);
    }
})