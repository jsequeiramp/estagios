﻿$("document").ready(function () {

    /// Métodos Auxiliares ----------------------------------------------------------------------------------------------------

    var idUnico = 0;

    // to-do? 
    // Modificar tooltips
    // Caso os dados a receber sejam diferentes, arranjar maneira de analisar e
    // alterar para que possam encaixar todos num método 
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(function (d) {
            return "<p>Dados: <span style='color:green'>" + d.name + "</span></p>" +
                "<p></p>"+
                "<p>Data: "+ d.date + "</p>" +
                "<p>Percentagem: " + ((Number(d.y).toFixed(2))) + "%</p>";
        });

    // Dados temporários para KPI
    var random = Math.random();

    setInterval(function () {
        random = Number(Math.random() * 100).toFixed(0);
    }, 1500);


    /// to-do encapsular métodos auxiliares

    /// <summary>
    /// Método auxiliar para concretizar a herança entre classes, neste caso atribuimos o 
    /// Construtor ao filho
    /// </summary>
    /// <param name="Filho"> Class que vai herdar os métodos da classe Base </param>
    /// <param name="Pai"> Class base que vai partilhar os seus métodos </param>
    var Herda = function (Filho, Pai) {
        Filho.prototype = Object.create(Pai.prototype);
        Filho.prototype.constructor = Filho;
    }


    /// <summary>
    /// Constroi icon que simbolilza o loading
    /// </summary>
    /// <param name="elemento"> Elemento que vai receber o Spinner </param>
    var ConstroiSpinner = function (widget) {
        var opts = {
            lines: 14, // The number of lines to draw
            length: 0, // The length of each line
            width: 20, // The line thickness
            radius: 46, // The radius of the inner circle
            scale: 0.75, 
            corners: 1, // Corner roundness (0..1)
            rotate: 81, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#fff', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 47, // Afterglow percentage
            opacity: 0,
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: "spinner", // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: "50%", // Top position relative to parent
            left: "50%" // Left position relative to parent
        };


        // show a spinner in place of the icon
        var target = $("."+widget.id).find(".wrapper")[0];
        widget.spinner = new Spinner(opts).spin(target);
    }


    /// <summary>
    /// Função que efetua os pedidos ajax para adquirir os dados necessários para a visualização
    /// </summary>
    /// <param name="widget"> Widget que está a pedir dados </param>
    /// <param name="ficheiro"> ficheiro para fazer o pedido </param>
    var getDados = function (widget, ficheiro) {

        var url = "http://192.168.0.17/dashboard/Actividade%204/Website/JSON/" + ficheiro + ".JSON",
            url1 = "http://localhost:57574/Website/JSON/" + ficheiro + ".JSON";


        return $.ajax({
            type: "GET",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            async: false,
            cache: false,
            // Constroi o spinner 
            beforeSend: function() {
                ConstroiSpinner(widget);
                $("." + widget.id).addClass("carregar")
            },
            // Depois do pedido estar completo
            complete: function() {
                setTimeout(function () {
                    widget.spinner.stop();
                    $("." + widget.id).removeClass("carregar");
                }, 20);
            },
            url: url,
            // Ao receber o pedido
            success: function() {
                console.log("Dados obtidos");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            },
        }).responseText;

    }


    /// <summary>
    /// Função para verificar se um número é inteiro
    /// </summary>
    /// <param name="valor"> Valor recebido para testar </param>
    /// <returns> Retorna true se for inteiro, false se não for </returns>
    var confirmaInteiro = function (valor) {
        var inteiro = /[0-9 -()+]+$/;

        return inteiro.test(valor) && Math.floor(valor) == valor;
    }

    /// Classes ----------------------------------------------------------------------------------------------------

    /// <summary>
    /// Class pai de todas as outras, contém maior parte da informação que vai ser partilhada entre os widget
    /// Vão herdar desta class em especifico
    /// Module Pattern
    /// </summary>
    var Widget = (function () {
        var widgetLargura,
            widgetAltura,
            widgetX,
            widgetY,
            titulo,
            id,
            largura,
            altura,
            svg,
            mostraToolTip,
            mostraLegenda,
            ultimaAtualizacao,
            dados,
            spinner,
            margem = { cima: 20, baixo: 50, esquerda: 30, direita: 50 };

        /// <summary>
        /// Construtor da class Widget
        /// </summary>
        function Widget(el, titulo, widgetAltura, widgetLargura, widgetX, widgetY) {

            // Atribuição de altura e largura conforme o elemento em que se encontra
            // to-do
            this.largura = $("." + el).width();
            this.altura = $("."+el).height();
            this.el = el;

            // Inicialização do construtor
            (titulo !== undefined) ? this.titulo = titulo : this.titulo = "titulo";
            this.widgetAltura = widgetAltura;
            this.widgetLargura = widgetLargura;
            this.widgetX = widgetX;
            this.widgetY = widgetY;

            // to-do Criação de um ID unico
            this.id = el;
            
            // Inicialização dos dados default
            this.mostraLegenda = false,
            this.mostraToolTip = false,
            this.ultimaAtualizacao = $.datepicker.formatDate('yy/mm/dd', new Date());
            this.margem = margem;

            // Liga evento para mudar titulo
            this.ModificaTitulo();

            console.log(this);
        }


        /// <summary>
        /// Cria um svg e acrescenta-o à DOM, atribui o selector à variável svg
        /// </summary>
        /// <param name="id"> Id do widget, utilizado para selecção do mesmo </param>
        Widget.prototype.ConstroiSVG = function (id, self) {

            self.svg = d3.select("." + id).select(".wrapper").insert("svg")
                .attr("width", self.largura + margem.esquerda + margem.direita)
                .attr("height", self.altura + margem.cima + margem.baixo)
              .append("g")
                .attr("transform", "translate(" + self.margem.esquerda + "," + self.margem.cima + ")");

            self.svg.call(tip);

        }


        /// <summary>
        /// "Desenha" no ecra após as atualizações necessárias, de dimensão ou dados
        /// </summary>
        Widget.prototype.Renderiza = function () {

            var self = this;
            // to-do self?

            // Volta a redefinir o SVG com o widget que foi selecionado para ser updated
            svg = d3.select("[name=" + self.parent().attr("name") + "]").select(".wrapper");

            // Atualizar dimensões conforme a "widget"
            self.AtualizaDimensoes();

            //update svg elements to new dimensions
            d3.select("#main-gridstack").select("[name=" + self.parent().attr("name") + "]").select(".wrapper svg")
              .attr("width", largura + margem.esquerda + margem.direita)
              .attr("height", altura + margem.cima + margem.baixo);

            self.Atualiza();
        }


        /// <summary>
        /// Método para adaptar os dados de forma correta ao gráfico pretendido
        /// </summary>
        Widget.prototype.InsereDados = function (dados) {
            // to-do
        }


        /// <summary>
        /// Método que atualiza o widget, p.ex a sua escala ou os dados
        /// </summary>
        Widget.prototype.Atualiza = function () {
            // to-do
            console.log("widget prototype atualiza");
        }


        /// <summary>
        /// Método para atualizar as dimensões atuais de um certo widget de acordo com o seu wrapper
        /// </summary>
        Widget.prototype.AtualizaDimensoes = function () {
            var self = this;

            self.largura = $("." + self.el).width();

            // Se for maior for que a sua altura original, volta ao seu Max
            if (self.largura > $("." + self.el).width() - self.margem.esquerda - self.margem.direita) {
                self.largura = $("." + self.el).width() - self.margem.esquerda - self.margem.direita;
            }

            self.altura = $("." + self.el).height();

            // Retirados 20 pixeis por causa do nome que ocupa mais espaço devido ao seu angulo
            if (self.altura > $("." + self.el).height() - self.margem.cima - self.margem.baixo - 20) {
                self.altura = $("." + self.el).height() - self.margem.cima - self.margem.baixo - 20;
            }

        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        Widget.prototype.ConstroiGrafico = function (id) {
            var self = this;

            this.ConstroiSVG();
            this.Renderiza();

        }

        /// <summary>
        /// Evento que vai modifica ro nome caso o utilizador o queira
        /// </summary>
        Widget.prototype.ModificaTitulo = function () {
            var self = this;

            // Ligamos o evento ao botão do widget
            $("." + self.el).on("click", ".edita-widget", function () {
                // Ao clicar chama o método setTitulo
                self.setTitulo(prompt("Digite o titulo que pretende"));
            });

        }


        /// <summary>
        /// Get e set para o objecto dados
        /// </summary>
        Widget.prototype.setDados = function (dados) {
            this.dados = dados;
        }


        /// <summary>
        /// Evento que vai modificar o titulo do Widget
        /// </summary>
        Widget.prototype.setTitulo = function (titulo) {
            var self = this;

            // Atribui o titulo
            self.titulo = titulo;
            // Substitui na DOM
            $("." + self.el).find(".titulo").text(self.titulo);
        }

        /// <summary>
        /// Cria o botão e liga o evento de mudança de formato
        /// </summary>
        Widget.prototype.OpcaoUpdate = function () {
            var self = this;

            // Criar botão para simbolizar o update
            $("." + self.id).find(".widget-navbar").append("<button type=\"button\"" + "class=\"update-widget\">" +
                                                           "<i class=\"glyphicon glyphicon-refresh\">" + "</i>" + "</button");

            // Atualizar gráfico ao clickar o botão
            $("." + self.id).on("click", ".update-widget", function () {
                self.Atualiza();
            });
        }


        /// Retorna o objeto criado
        return Widget;

    })();



    /// <summary>
    /// Classe Gráfico de Área 
    /// Module Pattern
    /// </summary>
    var GraficoArea = (function () {
        var TamanhoLimite = 350, /// to-do?
            /// to-do dataNest? series?
            dataNest,
            series,
            /// to-do ---------
            escalaY,
            escalaX,
            transformaX,
            transformaY,
            area,
            nomeEixoX = "Eixo X",
            nomeEixoY = "Eixo Y",
            modoVisualizacao = "normal",  // stacked
            suavizarLinhas = false;

        // Stacked
        var parseDate = d3.time.format("%y-%b-%d").parse,
            formatPercent = d3.format(".0%"),
            stack,
            dadosNormal,
            dadosStacked,
            color = d3.scale.category20(),
            chave = [],
            valores,
            ponto,
            pontos;

        /// <summary>
        /// Método construtor para a classe GraficoArea, chama o construtor do Widget 
        /// </summary>
        function GraficoArea(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY)
            this.modoVisualizacao = "normal";
        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(GraficoArea, Widget);


        /// <summary>
        /// Adapta os dados e acrescenta-os ao DOM, mais especificamente na secção do SVG
        /// </summary>
        GraficoArea.prototype.InsereDados = function () {
            var self = this;
            // to-do id?

            // Largura de cada rectangulo, de acordo com o tamanho do widget
            larguraRect = (self.largura / self.dados.length);


            if (self.modoVisualizacao === "stacked") {
                stack = d3.layout.stack()
                    .values(function (d) { return d.values; });
            }


            // Update nos paths do gráfico
            // método d3 que cria um "path" equivalente a uma area de acordo com os dados fornecidos
            area = d3.svg.area()
                // Devolve o "X" de cada valor "nome" no objecto Dados de acordo com a escala X
                .x(function (d) { return transformaX(d.date); })
             // y0 é igual a altura pois no d3 a escala é feita de forma contrária
                    .y0(function (d) { return self.altura; })
                    // Devolve o "Y" de cada valor "teste1" no objecto Dados de acordo com a escala Y
                    .y1(function (d) { return transformaY(d.y); });


            if(self.modoVisualizacao === "stacked") {
                area
                    // y0 é igual a altura pois no d3 a escala é feita de forma contrária
                    .y0(function (d) { return transformaY(d.y0); })
                    // Devolve o "Y" de cada valor "teste1" no objecto Dados de acordo com a escala Y
                    .y1(function (d) { return transformaY(d.y0 + d.y); });
            } else {
                //to-do
            }


            // Inicia controlo de cores padrão to-do
            // Controla as keys (Series) que vão estar contidas no gráfico
            color.domain(d3.keys(self.dados[0]).filter(function (key) { return key !== "date"; }));


            // Para cada objecto vamos analisar a data
            self.dados.forEach(function (d) {
                d.date = parseDate(d.date);
            })


            if (self.modoVisualizacao === "stacked") {

                // Criar novo array de objectos para guardar a informação de forma fácil de utilizar
                // Recorre ao método stack do d3
                dadosStacked = stack(color.domain().map(function (name) {

                    return {
                        // Atribuir nome da chave
                        name: name,
                        // Atribuir valores
                        values: self.dados.map(function (d) {
                            // Data e valor a dividir por 100, pois escala está no padrão [0,1]
                            return { name: name, date: d.date, y: +d[name] / 100 };
                        })
                    }
                }));
               

                // Atualizar eixo depois de dados inseridos
                transformaX.domain(d3.extent(self.dados, function (d) { return d.date; }));


                // Acrescentar ao SVG
                dados = self.svg.selectAll(".dados")
                                .data(dadosStacked)
                              .enter().append("g")
                                .attr("class", "dados")
                                // Compensar margem da esquerda
                                .attr("transform", "translate(" + self.margem.esquerda/2 + " ,0)");

                // Acrescenta o desenho do gráfico
                dados.append("path")
                    .attr("class", "area")
                    .attr("title", "")
                    // Chamar area() para desenhar de acordo o "path" com os valores
                    .attr("d", function (d) { return area(d.values); })
                    // Adiciona tooltips
                    .style("fill", function (d) { return color(d.name); });

                // Grupo das tooltips
                self.pontos = self.svg.append("g")
                    .attr("class", "pontos");

                // Circulo que apresenta o "foco" do utilizador
                self.pontos.append("circle")
                    .attr("class", "circuloFoco")
                    .style("fill", "none")
                    .style("stroke", "red")
                    .style("stroke-width", "2")
                    .attr("r", 4)
                        .style("display", "none");

                // Para cada objecto ( Ponto )
                dadosStacked.forEach(function (item, curIndex) {
                    // Para cada "variável"
                    self.pontos.selectAll(".ponto" + curIndex)
                        // Ligar o valor dos pontos
                        .data(item.values)
                      // Inserir rectangulo
                      .enter().append("rect")
                        .attr("class", "ponto" + curIndex)
                        .attr("x", function (d) { return transformaX(d.date); })
                        .attr("y", function (d) { return transformaY(d.y0 + d.y); })
                        .attr("width", "2")
                        .attr("height", function (d) { return self.altura - transformaY(d.y); })
                        .style("opacity", "0")
                        // Adicionar tooltip
                        .on('mouseover', tip.show)
                        .on('mouseout', tip.hide);

                });


            } else {


                // Criar novo array de objectos para guardar a informação de forma fácil de utilizar
                dadosNormal = color.domain().map(function (name) {
                    return {
                        // Atribuir nome da chave
                        name: name,
                        // Atribuir valores
                        values: self.dados.map(function (d) {
                            // Data e valor a dividir por 100, pois escala está no padrão [0,1]
                            return {name: name, date: d.date, y: d[name]};
                        })
                    }
                });


                // Adquirir valor máximo de cada uma das chaves
                dadosNormal.forEach(function (item, i) {
                    chave.push(d3.max(item.values, function (d) { return d.y; }));
                });


                // Atribuir dominios aos métodos de transformação
                transformaX.domain(d3.extent(self.dados, function (d) { return d.date; }));
                // to-do var close
                transformaY.domain([0, d3.max(chave)]);


                // Passar os dados para dentro de um objecto para serem facilmente lidos pelos métodos d3
                valores = [{ values: dadosNormal }];

                // Acrescentar ao SVG
                dados = self.svg.selectAll(".dados")
                                .data(dadosNormal)
                              .enter().append("g")
                                .attr("class", "dados")
                                // Compensar margem da esquerda
                                .attr("transform", "translate(" + self.margem.esquerda/2 + " ,0)");

                // Acrescenta o desenho do gráfico
                dados.append("path")
                    .attr("class", "area")
                    .attr("title", "")
                    // Chamar area() para desenhar de acordo o "path" com os valores
                    .attr("d", function (d) { return area(d.values); })
                    // Adiciona tooltips
                    .style("fill", function (d) { return color(d.name); });


                // Grupo das tooltips
                self.pontos = self.svg.append("g")
                    .attr("class", "pontos");

                // Circulo que apresenta o "foco" do utilizador
                self.pontos.append("circle")
                    .attr("class", "circuloFoco")
                    .style("fill", "none")
                    .style("stroke", "red")
                    .style("stroke-width", "2")
                    .attr("r", 4)
                        .style("display", "none");

                // Para cada objecto ( Ponto )
                dadosNormal.forEach(function (item, curIndex) {
                    // Para cada "variável"
                    self.pontos.selectAll(".ponto" + curIndex)
                        // Ligar o valor dos pontos
                        .data(item.values)
                      // Inserir rectangulo
                      .enter().append("rect")
                        .attr("class", "ponto" + curIndex)
                        .attr("x", function (d) { return transformaX(d.date); })
                        .attr("y", function (d) { return transformaY(d.y); })
                        .attr("width", "2")
                        .attr("height", function (d) { return self.altura - transformaY(d.y); })
                        .style("opacity", "0")
                        // Adicionar tooltip
                        .on('mouseover', tip.show)
                        .on('mouseout', tip.hide);

                });
            }

        }


        /// <summary>
        /// Constroi e atribui a variáveis os construtores de eixos e as respetivas escalas
        /// </summary>
        GraficoArea.prototype.ConstroiEixos = function () {

            var self = this;

            // to-do 
            // dadosSelecionados?
            // nome? data
            // teste1? valores


            // Atribui valores a Y conforme a sua escala
            transformaX = d3.time.scale()
                // Mapeia o dominio conforme a dadosSelecionados, e o "nome" to-do
                //.domain(self.dados.map(function (d) { return d.nome; }))
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .domain(d3.extent(self.dados, function (d) { return d.date; }))
                .range([0, self.largura]);

            // Construtor do Eixo dos X
            escalaX = d3.svg.axis()
              .scale(transformaX)
              // Orientação da escala
              .orient("bottom");

            // Atribui valores a Y conforme a sua escala
            transformaY = d3.scale.linear()
              //.domain([0, d3.max(self.dados, function (d) { return d.teste1; })])
              .range([self.altura, 0]);

            // Construtor do Eixo dos Y
            escalaY = d3.svg.axis()
              .scale(transformaY)
              .orient("left");

            // Adiciona escala em formato percentagem 
            if (self.modoVisualizacao === "stacked") {
                escalaY
                    .tickFormat(formatPercent);
            } else {
            
            }
        }


        /// <summary>
        /// Atualização dos eixos através da construção de escalas novas, incluindo o método da àrea
        /// </summary>
        GraficoArea.prototype.AtualizaEixos = function () {
            var valores,
                self = this,
                intervaloData = (d3.extent(self.dados, function (d) { return d.date; }));


            // Atribui valores a Y conforme a sua escala
            transformaX = d3.time.scale()
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .range([0, $("." + self.id).find(".wrapper").width() - self.margem.esquerda - self.margem.direita])
                // Mapeia o dominio conforme a a data disponivel nos dad
                .domain(d3.extent(self.dados, function (d) { return d.date; }));


            if (self.modoVisualizacao === "stacked") {
                // Atribui valores a Y conforme a sua escala
                transformaY = d3.scale.linear()
                    // Para stack não é preciso domain
                    //.domain([0, d3.max(self.dados, function (d) { return d.teste1; })])
                    .range([self.altura, 0]);

            } else {
               transformaY = d3.scale.linear()
                    // to-do close
                    .domain([0, d3.max(chave)])
                    .range([self.altura, 0]);
            }

            //// Atualização da escala dos Eixos
            escalaX.scale(transformaX);
            escalaY.scale(transformaY);


            // Numero de representações nos eixos de acordo com o tamanho do widget
            if (self.altura > TamanhoLimite) {
                escalaY.ticks(10);
            }
            if (self.altura <= TamanhoLimite) {
                escalaY.ticks(5);
            }
            if (self.altura <= (TamanhoLimite - 100)) {
                escalaY.ticks(2);
            }


            // Se largura for maior ou igual ao tamanho limite a escala X vai dispor todos os valores do dominio X
            if (self.largura > TamanhoLimite) {
                //ATUAL----
                //escalaX.tickValues(d3.time.months(intervaloData[0], intervaloData[1]));
            }
            // Caso seja menor ou igual, apenas dispões os numeros pares
            if (self.largura <= TamanhoLimite) {
               // escalaX.tickValues(d3.time.months(intervaloData[0], intervaloData[1]));
            }
            // Caso seja apenas menor que o TamanhoLimite - 100 vai apenas dispor os numeros divisiveis por 5
            if (self.largura < (TamanhoLimite - 100)) {
                //escalaX.tickValues(d3.time.months(intervaloData[0], intervaloData[1]));
            }

            // Atualização do eixo dos X
            self.svg.select(".x.axis")
                .attr("class", "x axis")
                .attr("transform", "translate(" + self.margem.esquerda/2 + " ," + self.altura + ")")
                .call(escalaX)
            .selectAll("text")
              .attr("dx", "-2em")
              .attr("dy", ".5em")
              .attr("transform", "rotate(-35)");

            // Atualização do eixo dos Y
            self.svg.select(".y.axis")
                .attr("class", "y axis")
                .attr("transform", "translate("+ self.margem.esquerda / 2 + " , 0)")
                .call(escalaY);
        }


        /// <summary>
        /// Inserção dos eixos no SVG do widget
        /// </summary>
        GraficoArea.prototype.InsereEixos = function () {
            var self = this;


            if (self.modoVisualizacao === "stacked") {
            // Insere eixo dos X (Stacked)
            self.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + self.margem.esquerda +"," + self.altura + ")")
                .call(escalaX);

            // Insere eixo dos Y (Stacked)
            self.svg.append("g")
                .attr("class", "y axis")
                .call(escalaY);
                
            } else {
                self.svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + self.altura + ")")
                    .call(escalaX);

                self.svg.append("g")
                    .attr("class", "y axis")
                    .call(escalaY)
                  .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    //.text("nomeEixoY");
            }

        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        GraficoArea.prototype.ConstroiGrafico = function (id) {
            var self = this;

            // to-do
            // nome?
            // teste1?

            // Chama a função getDados
            // Transforma o texto de JSON para objecto, seleciona o objecto devolvido
            // Chama a função setDados para guardar o objecto
            //self.setDados($.parseJSON(getDados(self, "ficheiro")).dadosSelecionados);

            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("graficoArea");

            // Atualiza dimensoes atuais
            self.AtualizaDimensoes();
            self.ConstroiSVG(id, self);
            self.ConstroiEixos();
            self.InsereDados();

            //self.Renderiza();

            self.InsereEixos();
            self.Atualiza();
            // Insere Botão de update na navbar
            self.OpcaoUpdate();

            self.ConstroiLegenda();
        }


        /// <summary>
        /// "Desenha" no ecra após as atualizações necessárias, de dimensão ou dados 
        /// </summary>
        GraficoArea.prototype.Renderiza = function () {
            var self = this;


            // Atualizar dimensões conforme a "widget"
            self.AtualizaDimensoes();

            // Atualiza SVG
            d3.select("." + self.id).select(".wrapper svg")
                .attr("width", self.largura + self.margem.esquerda + self.margem.direita)
                .attr("height", self.altura + self.margem.cima + self.margem.baixo);


            // Atualizar escala - para dentro do atualiza to-do
            self.AtualizaEixos();

        }


        /// <summary>
        /// Cria a legenda do gráfico, procura por "desenhos"(gráficos) e para cada um deles cria uma legenda apropriada
        /// </summary>
        GraficoArea.prototype.ConstroiLegenda = function () {
            var self = this,
                series = $("." + self.id).find(".wrapper").find(".dados").length,
                legenda;

            //color.domain(d3.keys(self.dados[0]).filter(function (key) { return key !== "date"; }));
            legenda = d3.select("." + self.id).select(".legenda").insert("svg");

            for (var i = 0; i < series; i++) {
                legenda.append("circle")
                    .attr("r", 5)
                    .attr("cx", 15)
                    .attr("cy", 15+20 * i)
                    .style("fill", color(color.domain()[i]));

                legenda.append("text")
                    .attr("x", 30)
                    .attr("y", ((15 + 20 * i) + 5))
                    .text(color.domain()[i]);

            }

        }


        /// <summary>
        /// Método que atualiza os elementos que representam os dados
        /// atualiza os elementos dentro do SVG do widget
        /// </summary>
        GraficoArea.prototype.Atualiza = function () {
            var self = this;

            // Pintar gráfico
            self.Renderiza();

            // Atualizar os dados
            // Seleciona todos os elementos com class .area e liga-os aos dados
            self.svg.selectAll(".area")
                .attr("d", function (d) { return area(d.values); })
                .style("fill", function (d) { return color(d.name); });

            // Caso esteja modo visualização stacked
            if (self.modoVisualizacao === "stacked") {

                // Para cada objecto ( Ponto )
                dadosStacked.forEach(function (item, curIndex) {

                    // Largura de cada rectangulo, de acordo com o tamanho do widget

                    // Para cada "variável"
                    self.pontos.selectAll(".ponto" + curIndex)
                        // Ligar o valor dos pontos
                        .data(item.values)
                      // Inserir rectangulo
                        .attr("x", function (d) { return transformaX(d.date); })
                        .attr("y", function (d) { return transformaY(d.y0 + d.y); })
                        .attr("width", "2")
                        .attr("height", function (d) { return self.altura - transformaY(d.y); })
                            .style("opacity", "0")
                        // Compensar margem para eixo dos Y
                        .attr("transform", "translate(" + self.margem.esquerda + " ,0)")
                        // Adicionar tooltip
                            .on("mouseover", tip.show)         
                                //{
                                //// to-do  !!!
                                //// Mostra circulo/ponto onde o utilziar está focado
                                //d3.select("."+self.id).select(".circuloFoco").style("display", null)
                                //    // Adicionar metade da largura de um rectangulo para centrar o ponto
                                //    .attr("transform", "translate(" + ((parseInt($(this).attr("x")) + larguraRect / 2) + self.margem.esquerda) + "," + $(this).attr("y") + ")");

                                //// Cria uma marca auxiliar no gráfico
                                //d3.select(this.parentNode).append("rect")
                                //    .attr("class", "marcaAuxiliar")
                                //    .attr("x", (parseInt($(this).attr("x")) + self.margem.esquerda))
                                //    .attr("y", $(this).attr("y"))
                                //    .attr("width", "2")
                                //    .attr("height", (self.altura - $(this).attr("y")))
                                //    .style("fill", "red");

                      //      })
                            .on("mouseout",tip.hide);
                      // {

                                // Esconde circulo/ponto
                                d3.select("." + self.id).select(".circuloFoco").style("display", "none");

                                // Remove marca auxiliar
                                //d3.select(".marcaAuxiliar").remove();

                            //});

                });

            } else {

                // Para cada objecto ( Ponto )
                dadosNormal.forEach(function (item, curIndex) {

                    // Para cada "variável"
                    self.pontos.selectAll(".ponto" + curIndex)
                        // Ligar o valor dos pontos
                        .data(item.values)
                      // Inserir rectangulo
                        .attr("x", function (d) { return transformaX(d.date); })
                        .attr("y", function (d) { return transformaY(d.y); })
                        .attr("width", "2")
                        .attr("height", function (d) { return self.altura - transformaY(d.y); })
                            .style("opacity", "0")
                        // Compensar margem para eixo dos Y
                        .attr("transform", "translate(" + self.margem.esquerda/2 + " ,0)")
                            // Adicionar tooltip
                            .on('mouseover', tip.show)
                            // Mostra tooltip
                            //tip.show();

                        //    // Mostra rectangulo
                        //    d3.select(this).style("fill", "red").style("opacity", "0.8");
                        //    // Mostra circulo/ponto onde o utilziar está focado
                        //    d3.select("." + self.id).select(".circuloFoco").style("display", null)
                        //        // Adicionar metade da largura de um rectangulo para centrar o ponto
                        //        .attr("transform", "translate(" + (parseInt($(this).attr("x")) + larguraRect /2) + "," + $(this).attr("y") + ")");

                        //})
                            .on('mouseout', tip.hide);
                    //  {
                    // Esconde tooltip
                    //        tip.hide();

                    // Esconde rectangulo
                    //      d3.select(this).style("fill", "red").style("opacity", "0");
                    // Esconde circulo/ponto
                    //    d3.select("." + self.id).select(".circuloFoco").style("display", "none");
                    //    });
                    // Esconder

                });
            }
        }


        /// <summary>
        /// Atribui ao gráfico o seu modo de visualização e chama o método update
        /// </summary>
        GraficoArea.prototype.setModoVisualizacao = function (modo) {
            var self = this;

            self.modoVisualizacao = modo;

        }


        /// <summary>
        /// Suaviza as linhas do gráfico através da interpolação
        /// </summary>
        GraficoArea.prototype.SuavizarLinhas = function (suaviza) {
            var self = this;

            if (suaviza === true) {
                // método d3 que cria um "path" equivalente a uma area de acordo com os dados fornecidos
                area = d3.svg.area()
                    // Devolve o "X" de cada valor "nome" no objecto Dados de acordo com a escala X
                    .x(function (d) { return transformaX(d.nome); })
                    // y0 é igual a altura pois no d3 a escala é feita de forma contrária
                    .y0(self.altura)
                    // Devolve o "Y" de cada valor "teste1" no objecto Dados de acordo com a escala Y
                    .y1(function (d) { return transformaY(d.teste1); })
                     //Faz a interpolação para suavizar as linhas
                    .interpolate("basis");
            } else {
                // método d3 que cria um "path" equivalente a uma area de acordo com os dados fornecidos
                area = d3.svg.area()
                    // Devolve o "X" de cada valor "nome" no objecto Dados de acordo com a escala X
                    .x(function (d) { return transformaX(d.nome); })
                    // y0 é igual a altura pois no d3 a escala é feita de forma contrária
                    .y0(self.altura)
                    // Devolve o "Y" de cada valor "teste1" no objecto Dados de acordo com a escala Y
                    .y1(function (d) { return transformaY(d.teste1); });
            }

            // Atualiza gráfico
            self.Atualiza();
        }


        /// Retorna o objecto criado
        return GraficoArea;

    })();



    /// <summary>
    /// Classe Gráfico de Barras
    /// Module Pattern
    /// </summary>
    var GraficoBarras = (function () {
        var TamanhoLimite = 350, /// to-do?
            /// to-do dataNest? series?
            dataNest,
            series,
            color,
            /// to-do ---------
            escalaY,
            escalaX,
            transformaX,
            transformaX1,
            transformaY,
            area,
            nomeEixoX = "Eixo X",
            nomeEixoY = "Eixo Y",
            modoVisualizacao = "Normal";

        var parseDate = d3.time.format("%d-%b-%y").parse,
            selecao,
            color = d3.scale.ordinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]),
                chave = [];

        /// <summary>
        /// Método construtor para a classe GraficoBarras, chama o construtor do Widget 
        /// </summary>
        function GraficoBarras(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);
            this.modoVisualizacao = "grouped";
        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(GraficoBarras, Widget);


        /// <summary>
        /// Passa o gráfico para modo Grouped ( Agrupado ) 
        /// desenha todas as barras novamente e calcula o máximo, para os eixos depois serem ajustados
        /// </summary>
        GraficoBarras.prototype.Agrupa = function() {
            var self = this;

            self.AtualizaEixos();

            self.selecao.selectAll("rect")
                // to-do modificar nome State para um genérico - Contar numero de keys e substituir pelo inteiro
                .attr("x", function (d, curIndex) { return transformaX(self.dados[curIndex].State) / 7 ; })
                .attr("width", transformaX.rangeBand() / 7)
              .transition()
                .attr("y", function (d) { return transformaY(d.y1 - d.y0); })
                .attr("height", function (d) { return self.altura - transformaY(d.y1 - d.y0); });

        }


        /// <summary>
        /// Adapta os dados e acrescenta-os ao DOM, mais especificamente na secção do SVG
        /// </summary>
        GraficoBarras.prototype.InsereDados = function () {
            var self = this;
            // to-do id?
            // nome
            // teste1 / nome

            if (self.modoVisualizacao === "stacked" || self.modoVisualizacao === "grouped") {
                // to-do  ( Modificar de state para outra variavel )
                color.domain(d3.keys(self.dados[0]).filter(function (key) { return key !== "State"; }));


                // Mapear dados através de d.ages (to-do)
                self.dados.forEach(function (d) {
                    var y0 = 0;
                    d.ages = color.domain().map(function (name) { return { name: name, y0: y0, y1: y0 += +d[name] }; });
                    d.total = d.ages[d.ages.length - 1].y1;
                });


                // Atualizar dominio do eixo depois de dados inseridos
                // Mapear de acordo com cada "State"
                transformaX.domain(self.dados.map(function (d) { return d.State; }));
                // Valor máximo dos dados
                transformaY.domain([0, d3.max(self.dados, function (d) { return d.total; })]);


                // Criar elemento "g" para cada representação
                self.selecao = self.svg.selectAll(".state")
                    .data(self.dados)
                  .enter().append("g")
                    .attr("class", "dados")
                    // Translação equivale à coordenada X de cada barra
                    .attr("transform", function (d) { return "translate(" + transformaX(d.State) + ",0)"; });

                if (self.modoVisualizacao === "stacked") {
                // Adicionar "barras" ao gráfico
                self.selecao.selectAll("rect")
                    .data(function (d) { return d.ages; })
                .enter().append("rect")
                    .attr("class", "barra")
                    // rangeBand() - Função que o espaço em "bandas" equivalentes
                    .attr("width", transformaX.rangeBand())
                    // Atribui a posição inicial
                    .attr("y", function (d) { return transformaY(d.y1); })
                    // Atribui altura correta conforme a sua posição inicial
                    .attr("height", function (d) { return transformaY(d.y0) - transformaY(d.y1); })
                        .style("fill", function (d) { return color(d.name); })
                        // Atribuir tooltips
                        .on("mouseover", tip.show)
                        .on("mouseout", tip.hide);
                }

            }

            if (self.modoVisualizacao === "grouped") {
                // Verificar máximo de cada "state" (modificar state para genérico to-do)
                self.dados.forEach(function (item, curIndex) {
                    chave.push(d3.max(item.ages, function (d) { return d.y1 - d.y0; }));
                })

                // Atualiza o dominio
                transformaY.domain([0, d3.max(chave)]);


                self.selecao.selectAll("rect")
                    .data(function (d) { return d.ages; })
                .enter().append("rect")
                    .attr("class", "barra")
                    // to-do modificar nome State para um genérico - Contar numero de keys e substituir pelo inteiro
                    .attr("x", function (d, curIndex) { return transformaX(self.dados[curIndex].State) / 7; })
                    .attr("width", transformaX.rangeBand() / 7)
                    .attr("y", function (d) { return transformaY(d.y1 - d.y0); })
                    .attr("height", function (d) { return self.altura - transformaY(d.y1 - d.y0); })
                .style("fill", function (d) { return color(d.name); })
                       // Atribuir tooltips
                       .on("mouseover", tip.show)
                       .on("mouseout", tip.hide);

            }

        }


        /// <summary>
        /// Método que atualiza o gráfico, p.ex a sua escala ou os dados
        /// </summary>
        GraficoBarras.prototype.Atualiza = function () {
            var self = this
            // to-do
            // dadosSelecionados
            // nome
            // teste1 / numero


            // Pintar gráfico
            self.Renderiza();


            // Caso esteja em modo Stacked ( Empilhado )
            if (self.modoVisualizacao === "stacked") {

                // Atualiza o dominio Y
                transformaY.domain([0, d3.max(self.dados, function (d) { return d.total; })]);


                // Atualizar posição X de cada uma das "colunas"
                self.selecao
                    .attr("transform", function (d) { var somaAuxiliar = transformaX(d.State) + self.margem.esquerda / 2; return "translate(" + somaAuxiliar+ ",0)"; });

                // Update de todas as barras
                self.selecao.selectAll("rect")
                    .transition()
                     // "Remover" atributo X, caso tenha sido atribuido quando estava em modo Grouped
                    .attr("x", null)
                    .attr("width", transformaX.rangeBand())
                    // Atribui a posição inicial
                    .attr("y", function (d) { return transformaY(d.y1); })
                    // Atribui altura correta conforme a sua posição inicial
                    .attr("height", function (d) { return transformaY(d.y0) - transformaY(d.y1); })
                        // Atribuir tooltips
                        //.on('mouseover', tip.show)
                        //.on('mouseout', tip.hide);

            }

            // Caso esteja em modo Grouped ( Agrupado )
            if (self.modoVisualizacao === "grouped") {
                // Atualizar posição X de cada uma das "colunas"
                self.selecao
                    .attr("transform", function (d) { var somaAuxiliar = transformaX(d.State) + self.margem.esquerda / 2; return "translate(" + somaAuxiliar + ",0)"; });

                self.Agrupa();

            }

        }


        /// <summary>
        /// Constroi e atribui a variáveis os construtores de eixos e as respetivas escalas
        /// </summary>
        GraficoBarras.prototype.ConstroiEixos = function () {
            var self = this;

            // to-do 
            // nome? data
            // teste1? valores

            // Atribui valores a Y conforme a sua escala
            transformaX = d3.scale.ordinal()
                // Mapeia o dominio conforme a dadosSelecionados, e o "nome" to-do
                .domain(self.dados.map(function (d) { return d.nome; }))
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .rangeRoundBands([0, self.largura], 0.1);


            // Construtor do Eixo dos X
            escalaX = d3.svg.axis()
              .scale(transformaX)
              // Orientação da escala
              .orient("bottom");


            // Atribui valores a Y conforme a sua escala
            transformaY = d3.scale.linear()
              // to-do numero?
              .domain([0, d3.max(self.dados, function (d) { return d.numero; })])
              .range([self.altura, 0]);


            // Construtor do Eixo dos Y
            escalaY = d3.svg.axis()
              .scale(transformaY)
              .orient("left")
              // Formato dos ticks
              .tickFormat(d3.format(".2s"));

        }


        /// <summary>
        /// Atualização dos eixos através da construção de escalas novas, incluindo o método da àrea
        /// </summary>
        GraficoBarras.prototype.AtualizaEixos = function () {
            var self = this;

            // Atribui valores a Y conforme a sua escala
            transformaX = d3.scale.ordinal()
                // Mapeia o dominio conforme a dadosSelecionados, e o "nome" to-do
                .domain(self.dados.map(function (d) { return d.State; }))
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .rangeRoundBands([0,  $("." + self.id).find(".wrapper").width() - self.margem.esquerda - self.margem.direita], 0.2);

            // Caso o modo seja stacked ( Empilhado ) 
            if (self.modoVisualizacao === "stacked") {
                // Atribui valores a Y conforme a sua escala
                transformaY = d3.scale.linear()
                    .domain([0, d3.max(self.dados, function (d) { return d.total; })])
                    .range([self.altura, 0]);
            }
            // Caso o modo seja grouped ( Agrupado )
            if (self.modoVisualizacao === "grouped") {
                // Verificar máximo de cada "state" (modificar state para genérico to-do)
                self.dados.forEach(function (item, curIndex) {
                    chave.push(d3.max(item.ages, function (d) { return d.y1 - d.y0; }));
                })

                // Atualiza o dominio
                transformaY.domain([0, d3.max(chave)])
                .range([self.altura, 0]);
            }



            // Atualização da escala dos Eixos
            escalaX.scale(transformaX);
            escalaY.scale(transformaY);


            // Atualizar coordenadas do Eixo do X de acordo com o tamanho do widget
            d3.select("."+self.id).select(".nomeEixoX")
                .attr("x", self.largura - 8)
                .attr("y", self.altura + self.margem.cima);


            // Se a altura do widget for menor
            if (self.altura <= 250) {
                // Remover nomeEixo
                // melhorar a visualização
                d3.select("." + self.id).select(".nomeEixoY")
                    .text("");
            } else {
                // Senão, voltar a adicionar o nome
                d3.select("." + self.id).select(".nomeEixoY")
                    .text(nomeEixoY);
            }


            // Numero de representações nos eixos de acordo com o tamanho do widget
            if (self.altura > TamanhoLimite) {
                escalaY.ticks(10);
            }
            if (self.altura <= TamanhoLimite) {
                escalaY.ticks(5);
            }
            if (self.altura <= (TamanhoLimite - 100)) {
                escalaY.ticks(2);
            }

            // Se largura for maior ou igual ao tamanho limite a escala X vai dispor todos os valores do dominio X
            if (self.largura > TamanhoLimite) {
                //escalaX.tickValues(transformaX.domain());
            }
            // Caso seja menor ou igual, apenas dispões os numeros pares
            if (self.largura <= TamanhoLimite) {
                //escalaX.tickValues(transformaX.domain().filter(function (d, i) { return !(i % 2); }));
            }
            // Caso seja apenas menor que o TamanhoLimite - 100 vai apenas dispor os numeros divisiveis por 5
            if (self.largura < (TamanhoLimite - 100)) {

                //escalaX.tickValues(transformaX.domain().filter(function (d, i) { return !(i % 5); }));
            }

            // Atualização do eixo dos X
            self.svg.select(".x.axis")
               // Translacção menos 5 pixeis para haver espaço para as letras no eixo do X
              .attr("transform", "translate(" + self.margem.esquerda / 2 + " ," + self.altura + ")")
              .call(escalaX)
            .selectAll("text")
              .attr("dx", "-2em")
              .attr("dy", ".5em")
              .attr("transform", "rotate(-35)");

            // Atualização do eixo dos Y
            self.svg.select(".y.axis")
                .attr("transform", "translate(" + self.margem.esquerda / 2 + " , 0)")
              .call(escalaY);

        }


        /// <summary>
        /// Inserção dos eixos no SVG do widget
        /// </summary>
        GraficoBarras.prototype.InsereEixos = function () {
            var self = this;


            // Acrescentar no g a escala X  e o seu nome
            self.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + self.altura + ")")
              .call(escalaX)
                .selectAll("text")
                .attr("dx", "-2em")
                .attr("dy", ".5em")
                .attr("transform", "rotate(-35)");

            //// Insere nome do eixo do X
            //self.svg.append("g")
            //  .append("text")
            //    .attr("class", "nomeEixoX")
            //    .attr("x", self.largura - 20)
            //    .attr("y", self.altura + self.margem.cima)
            //    .attr("dx", ".71em");
            //      .text(nomeEixoX);

            // Acrescentar no g a escala Y e o seu nome to-do
            self.svg.append("g")
              .attr("class", "y axis")
              .call(escalaY)
            // Insere nome do eixo do Y
            .append("text")
              .attr("class", "nomeEixoY")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(nomeEixoY);

            //self.AtualizaEixos();
        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        GraficoBarras.prototype.ConstroiGrafico = function (id) {
            var self = this;

            // to-do 
            // nome?
            // teste1?

            // Chama a função getDados
            // Transforma o texto de JSON para objecto, seleciona o objecto devolvido
            // Chama a função setDados para guardar o objecto
            //self.setDados($.parseJSON(getDados(self, "ficheiro1")).dadosBarras);

            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("graficoBarras");

            // Atualiza dimensoes atuais
            self.AtualizaDimensoes();
            self.ConstroiSVG(id, self);
            self.ConstroiEixos();
            self.InsereDados();

            self.InsereEixos();
            self.Atualiza();

            // Cria botão de "update"
            //self.OpcaoUpdate();

            // Liga o evento ao botão do widget
            self.ModificaVisualizacao();

            self.ConstroiLegenda();
        }


        /// <summary>
        /// "Desenha" no ecra após as atualizações necessárias, de dimensão ou dados 
        /// </summary>
        GraficoBarras.prototype.Renderiza = function () {
            var self = this;


            // Atualizar dimensões conforme a "widget"
            self.AtualizaDimensoes();


            //update svg para novas dimensões
            d3.select("." + self.id).select(".wrapper svg")
                .attr("width", self.largura + self.margem.esquerda + self.margem.direita)
                .attr("height", self.altura + self.margem.cima + self.margem.baixo);

            // Atualizar escala - para dentro do atualiza to-do
            self.AtualizaEixos();
 
        }


        /// <summary>
        /// Cria a legenda do gráfico, procura por "desenhos"(gráficos) e para cada um deles cria uma legenda apropriada
        /// </summary>
        GraficoBarras.prototype.ConstroiLegenda = function () {
            var self = this,
                series = self.selecao.data()[0].ages.length,
                legenda;

            //color.domain(d3.keys(self.dados[0]).filter(function (key) { return key !== "date"; }));
            legenda = d3.select("." + self.id).select(".legenda").insert("svg");

            for (var i = 0; i < series; i++) {
                legenda.append("circle")
                    .attr("r", 5)
                    .attr("cx", 15)
                    .attr("cy", 15 + 20 * i)
                    .style("fill", color(color.domain()[i]));

                legenda.append("text")
                    .attr("x", 30)
                    .attr("y", ((15 + 20 * i) + 5))
                    .text(self.selecao.data()[0].ages[i].name);

            }

        }


        /// <summary>
        /// Modifica entre os vários tipos de visualização
        /// </summary
        GraficoBarras.prototype.ModificaVisualizacao = function () {
            var self = this;

            console.log(self.modoVisualizacao);

            // Cria botão para sinalizar o modo visualizacao
            $("." + self.id).find(".widget-navbar").append("<button type=\"button\"" + "class=\"update-widget\">" +
                                                           "<i class=\"glyphicon glyphicon-refresh\">" + "</i>" + "</button");

            // Ao pressionar o botão update-widget, troca entre visualizações
            $("." + self.id).on("click", ".update-widget", function () {

                // Caso esteja em modo grouped ( Agrupado ) 
                if (self.modoVisualizacao !== "grouped") {
                    self.modoVisualizacao = "grouped";
                    self.Agrupa();
                }
                    // Caso esteja em modo stacked ( Empilhado )
                else {
                    if (self.modoVisualizacao !== "stacked") {
                        self.modoVisualizacao = "stacked";
                        self.Atualiza();
                    }
                }
            });

        }

        /// Retorna o objecto criado
        return GraficoBarras;

    })();



    /// <summary>
    /// Classe Gráfico de Linhas
    /// Module Pattern
    /// </summary>
    var GraficoLinhas = (function () {
        var TamanhoLimite = 350, /// to-do?
            /// to-do dataNest? series?
            dataNest,
            series,
            color,
            /// to-do ---------
            escalaY,
            escalaX,
            transformaX,
            transformaY,
            linha,
            nomeEixoX = "Eixo X",
            nomeEixoY = "Eixo Y",
            modoVisualizacao = "Normal",
            suavizarLinhas = "false",
            linhasConexao = "false",
            circulos = "false";


        /// <summary>
        /// Método construtor para a classe GraficoLinhas, chama o construtor do Widget 
        /// </summary>
        function GraficoLinhas(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);
        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(GraficoLinhas, Widget);


        /// <summary>
        /// Adapta os dados e acrescenta-os ao DOM, mais especificamente na secção do SVG
        /// </summary>
        GraficoLinhas.prototype.InsereDados = function () {
            var self = this;
            // to-do id?
            // dadosSelecionados
            // nome
            // teste1 / nome

            // Agrupa os dados conforme a key selecionada
            dataNest = d3.nest()
                // Seleciona key para agrupar
                .key(function (d) { return d.id; })
                // Escolhe onde vai buscar os dados a agrupar
                .entries(self.dados);

            // Componente D3 que disponibiliza um leque de cores
            color = d3.scale.category10()
                // Dominio das cores são filtradas por cada Key existente, neste  caso cada key é um ID
                .domain(d3.keys(self.dados[0]).filter(function (key) { return key === "id"; }));

            // Seleciona todas as series
            series = self.svg.selectAll(".series")
               // Liga os elementos aos dados dataNest
              .data(dataNest)
            // Acrescenta séries, caso não hajam suficientes para representar dataNest
            .enter().append("g")
              .attr("class", "series");

            // Acrescenta um path para cada série
            series.append("path")
              .attr("class", "linha")
              // Componente D3(area) devolve o path calculado de acordo com os valores
              .attr("d", function (d) { return linha(d.values); })
                // Uma cor é automaticamente escolhida de acordo com o componente color, para cada key
                .style("stroke", function (d) { return color(d.key); })
                .style("stroke-width", "2px")
                .style("fill", "none");
        }


        /// <summary>
        /// Constroi e atribui a variáveis os construtores de eixos e as respetivas escalas
        /// </summary>
        GraficoLinhas.prototype.ConstroiEixos = function () {
            var self = this;

            // to-do 
            // dadosSelecionados?
            // nome? data
            // teste1? valores

            // Atribui valores a Y conforme a sua escala
            transformaX = d3.scale.ordinal()
                // Mapeia o dominio conforme a dadosSelecionados, e o "nome" to-do
                .domain(self.dados.map(function (d) { return d.nome; }))
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .rangeRoundBands([0, self.largura], 0.1);

            // Construtor do Eixo dos X
            escalaX = d3.svg.axis()
              .scale(transformaX)
              // Orientação da escala
              .orient("bottom");

            // Atribui valores a Y conforme a sua escala
            transformaY = d3.scale.linear()
              // to-do numero?
              .domain([0, d3.max(self.dados, function (d) { return d.teste1; })])
              .range([self.altura, 0]);

            // Construtor do Eixo dos Y
            escalaY = d3.svg.axis()
              .scale(transformaY)
              .orient("left")
              .ticks(10);
        }


        /// <summary>
        /// Atualização dos eixos através da construção de escalas novas, incluindo o método da àrea
        /// </summary>
        GraficoLinhas.prototype.AtualizaEixos = function () {
            var self = this;
            // Atribui valores a Y conforme a sua escala
            transformaX = d3.scale.ordinal()
                // Mapeia o dominio conforme a dadosSelecionados, e o "nome" to-do
                .domain(self.dados.map(function (d) { return d.nome; }))
                // Intervalo de valores que podem ser atribuidos, conforme o dominio
                .rangeRoundBands([0, self.largura], 0.1);

            // Atribui valores a Y conforme a sua escala
            transformaY = d3.scale.linear()
                .domain([0, d3.max(self.dados, function (d) { return d.teste1; })])
                .range([self.altura, 0]);

            // Atualização da escala dos Eixos
            escalaX.scale(transformaX);
            escalaY.scale(transformaY);

            // Update nos paths do gráfico
            // método d3 que cria um "path" equivalente a uma area de acordo com os dados fornecidos
            linha = d3.svg.line()
                // Devolve o "X" de cada valor "nome" no objecto Dados de acordo com a escala X
                .x(function (d) { return transformaX(d.nome); })
                // Devolve o "Y" de cada valor "teste1" no objecto Dados de acordo com a escala Y
                .y(function (d) { return transformaY(d.teste1); });

            // Atualizar coordenadas do Eixo do X de acordo com o tamanho do widget
            d3.select("." + self.id).select(".nomeEixoX")
                .attr("x", self.largura - 8)
                .attr("y", self.altura + self.margem.cima);

            // Se a altura do widget for menor
            if (self.altura <= 250) {
                // Remover nomeEixo
                // melhorar a visualização
                d3.select("." + self.id).select(".nomeEixoY")
                    .text("");
            } else {
                // Senão, voltar a adicionar o nome
                d3.select("." + self.id).select(".nomeEixoY")
                    .text(nomeEixoY);
            }


            // Numero de representações nos eixos de acordo com o tamanho do widget
            if (self.altura > TamanhoLimite) {
                escalaY.ticks(10);
            }
            if (self.altura <= TamanhoLimite) {
                escalaY.ticks(5);
            }
            if (self.altura <= (TamanhoLimite - 100)) {
                escalaY.ticks(2);
            }

            // Se largura for maior ou igual ao tamanho limite a escala X vai dispor todos os valores do dominio X
            if (self.largura > TamanhoLimite) {
                escalaX.tickValues(transformaX.domain());
            }
            // Caso seja menor ou igual, apenas dispões os numeros pares
            if (self.largura <= TamanhoLimite) {
                escalaX.tickValues(transformaX.domain().filter(function (d, i) { return !(i % 2); }));
            }
            // Caso seja apenas menor que o TamanhoLimite - 100 vai apenas dispor os numeros divisiveis por 5
            if (self.largura < (TamanhoLimite - 100)) {
                escalaX.tickValues(transformaX.domain().filter(function (d, i) { return !(i % 5); }));
            }

            // Atualização do eixo dos X
            self.svg.select(".x.axis")
              // Translacção menos 5 pixeis para haver espaço para as letras no eixo do X
              .attr("transform", "translate(0," + (self.altura) + ")")
              .call(escalaX)
            .selectAll("text")
              .attr("dx", "-2em")
              .attr("dy", ".5em")
              .attr("transform", "rotate(-35)");

            // Atualização do eixo dos Y
            self.svg.select(".y.axis")
              .call(escalaY);


        }


        /// <summary>
        /// Inserção dos eixos no SVG do widget
        /// </summary>
        GraficoLinhas.prototype.InsereEixos = function () {
            var self = this;

            // Acrescentar no g a escala X e o seu nome
            self.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + self.altura + ")")
              .call(escalaX)
                // Roda os elementos do eixo dos X
                .selectAll("text")
                .attr("dx", "-2em")
                .attr("dy", ".5em")
                .attr("transform", "rotate(-35)");

            // Insere nome do eixo do X
            self.svg.append("g")
              .append("text")
                .attr("class", "nomeEixoX")
                .attr("x", self.largura)
                .attr("y", self.altura + self.margem.cima)
                .attr("dx", ".71em")
                  .text(nomeEixoX);

            // Acrescentar no g a escala Y e o seu nome to-do
            self.svg.append("g")
              .attr("class", "y axis")
              .call(escalaY)
            // Insere nome do eixo do Y
            .append("text")
              .attr("class", "nomeEixoY")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(nomeEixoY);

            self.AtualizaEixos();
        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        GraficoLinhas.prototype.ConstroiGrafico = function (id) {
            var self = this;

            // to-do
            // nome?
            // teste1?

            // Chama a função getDados
            // Transforma o texto de JSON para objecto, seleciona o objecto devolvido
            // Chama a função setDados para guardar o objecto
            //self.setDados($.parseJSON(getDados(self, "ficheiro")).dadosSelecionados);


            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("graficoLinhas");


            self.AtualizaDimensoes()
            self.ConstroiSVG(id, self);
            self.ConstroiEixos();
            // Pinta gráfico
            self.Renderiza()
            self.InsereDados();
            self.InsereEixos();

            // Insere Botão na navbar para atualizar o widget
            self.OpcaoUpdate();

        }


        /// <summary>
        /// "Desenha" no ecra após as atualizações necessárias, de dimensão ou dados 
        /// </summary>
        GraficoLinhas.prototype.Renderiza = function () {
            var self = this;

            // Volta a redefinir o SVG com o widget que foi selecionado para ser updated
            //svg = d3.select("[name=" + self.parent().attr("name") + "]").select(".wrapper");

            // Atualizar dimensões conforme a "widget"
            self.AtualizaDimensoes();


            // Atualiza SVG 
            d3.select("."+self.id).select(".wrapper svg")
                .attr("width", self.largura + self.margem.esquerda + self.margem.direita)
                .attr("height", self.altura + self.margem.cima + self.margem.baixo);


            // Atualizar escala - para dentro do atualiza to-do
            self.AtualizaEixos();


            // Aplica o método svg.line do d3 à variável linha
            linha = d3.svg.line()
                // Dá um valor X conforme a sua escala
                .x(function (d) { return transformaX(d.nome); })
                // Dá um valor Y conforme a sua escala
                .y(function (d) { return transformaY(d.teste1); });


        }


        /// <summary>
        /// Método que atualiza os elementos que representam os dados
        /// atualiza os elementos dentro do SVG do widget
        /// </summary>
        GraficoLinhas.prototype.Atualiza = function () {
            var self = this;

            self.Renderiza();

            // Seleciona todos os elementos da class .line e liga-os aos dados
            self.svg.selectAll(".linha").data(dataNest)
                // Para cada d, é calculado um novo path através da variável "linha"
                .attr("d", function (d) { return linha(d.values); })

        }


        /// <summary>
        /// Suaviza as linhas do gráfico através da interpolação
        /// </summary>
        GraficoLinhas.prototype.SuavizarLinhas = function (suaviza) {
            var self = this;

            if (suaviza === true) {
                // Aplica o método svg.line do d3 à variável linha
                linha = d3.svg.line()
                    // Dá um valor X conforme a sua escala
                    .x(function (d) { return transformaX(d.nome); })
                    // Dá um valor Y conforme a sua escala
                    .y(function (d) { return transformaY(d.teste1); })
                    // Faz a interpolação para suavizar as linhas
                    .interpolate("basis");
            } else {
                // Aplica o método svg.line do d3 à variável linha
                linha = d3.svg.line()
                    // Dá um valor X conforme a sua escala
                    .x(function (d) { return transformaX(d.nome); })
                    // Dá um valor Y conforme a sua escala
                    .y(function (d) { return transformaY(d.teste1); });
            }

            self.Atualiza();
        }



        /// Retorna o objecto criado
        return GraficoLinhas;
    })();



    /// <summary>
    /// Classe Gauge 
    /// Module Pattern
    /// </summary>
    var Gauge = (function () {
        var TamanhoLimite = 350, /// to-do?
            valorMinimo = 0,
            valorMaximo = 1,
            valorAtual = 0,
            escalaX,
            barraAtual,
            grafico,
            arcMeta,
            arcoVazio,
            arcoPintado,
            percentagem = 0,
            meta = 0,
            percentagemInicio = 0.75,
            raio = 100,
            modoVisualizacao = "arco";


        /// <summary>
        /// Converte de percentagem para graus
        /// </summary>
        /// <param name="percentagem"> Valor em percentagem entre 0 e 1</param>
        /// <returns> Valor convertido para Graus </returns>
        var PercentagemParaGraus = function (percentagem) {
            return percentagem * 360;
        }


        /// <summary>
        /// Converte de percentagem para graus
        /// </summary>
        /// <param name="percentagem"> Valor em graus </param>
        /// <returns> Valor convertido para Radianos </returns>
        var GrausParaRadianos = function (graus) {
            return graus * Math.PI / 180;
        }


        /// <summary>
        /// Converte de percentagem para radianos, converte primeiro para graus e só depois
        /// para radianos
        /// </summary>
        /// <param name="percentagem"> Valor em percentagem entre 0 e 1</param>
        /// <returns> Valor convertido para Radianos </returns>
        var PercentagemParaRadianos = function (percentagem) {
            return GrausParaRadianos(PercentagemParaGraus(percentagem));
        }


        /// <summary>
        /// Método construtor para a classe GraficoArea, chama o construtor do Widget 
        /// </summary>
        function Gauge(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);

        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(Gauge, Widget);


        /// <summary>
        /// GAUGE ARCO
        /// Cria um svg e acrescenta-o à DOM, atribui o selector à variável svg
        /// </summary>
        /// <param name="id"> Id do widget, utilizado para selecção do mesmo </param>
        Gauge.prototype.ConstroiSVGArco = function () {
            var self = this;

            // Seleciona Widget
            self.svg = d3.select("."+self.id).select(".wrapper").append("svg")
                      .attr("width", "95%")
                      .attr("height", "95%")
                      // Atribuida viewBox para ser responsivo
                      .attr('viewBox', '0 0 ' + "200" + ' ' + "100")
                      // Mantem proporção e tenta ir para o minimo de X e o meio do Y
                      .attr("preserveAspectRatio", "xMidYMid")


            // Acrescentar g
            grafico = self.svg.append("g")
              // Translaciona para colocar o centro no fundo e no meio do svg
              .attr("transform", "translate(" + raio + "," + raio + ")");


            grafico.append("path").attr("class", "arc grafico-vazio");
            // Liga ao gráfico um endAngle para as transições futuras
            grafico.append("path").datum({ endAngle: .75 }).attr("class", "arc grafico-pintado");
            grafico.append("path").attr("class", "arc meta");

            // Criados três arcos iguais, pois todos vão ter angulos diferentes
            arcMeta = d3.svg.arc().outerRadius(raio).innerRadius(raio / 2);
            arcVazio = d3.svg.arc().outerRadius(raio).innerRadius(raio / 2);
            arcPintado = d3.svg.arc().outerRadius(raio).innerRadius(raio / 2);

        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        Gauge.prototype.ConstroiGrafico = function (id) {
            var self = this;


            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("gauge");

            // to-do
            //self.MostraOpcoes();

            // Constroi Gráfico Arco
            if (modoVisualizacao === "arco") {
                self.ConstroiSVGArco();
                self.DesenhaGauge(0);
                setInterval(self.Atualiza(), 1500);
                setInterval(function () {
                    self.Atualiza();
                }, 1500);
                
            }
            // Constroi Gráfico Horizontal
            if (modoVisualizacao === "horizontal") {
                self.ConstroiSVG(id, self);
                self.ConstroiEixos();
                self.InsereEixos();
                self.Atualiza();
            }

        }


        /// <summary>
        /// Constroi eixos de acordo com os dados fornecidos, liga o valor a um dos elementos SVG
        /// Apenas para o gauge horizontal
        /// </summary>
        Gauge.prototype.ConstroiEixos = function () {
            var self = this;


            // Caso valores não sejam numéricos, atribuimos valores base para não dar erro
            if (!$.isNumeric($(".valor-maximo").val())) {
                valorMaximo = 1;
            }
            if (!$.isNumeric($(".valor-meta").val())) {
                meta = 0;
            }
            if (!$.isNumeric($(".valor-atual").val())) {
                valorAtual = 0;
            }

            // to-do  elemento
            d3.select(".wrapper").select("g").selectAll(".atual").data(valorAtual);

            escalaX = d3.scale.linear()
              .domain([0, valorMaximo])
              .range([0, 200]);

        }


        /// <summary>
        /// Insere o eixo construido
        /// Apenas para o gauge horizontal
        /// </summary>
        Gauge.prototype.InsereEixos = function () {
            var self = this;


            // Acrescenta um rectangulo para a gauge
            self.svg.append("rect")
              .attr("class", "base")
              .attr("x", 0)
              .attr("y", 0)
              // Dá uma largura conforme a escala e o seu valor
              .attr("width", escalaX(valorMaximo))
              .attr("height", 50)
                .style("fill", "grey");

            // Acrescenta um rectangulo com o valor atual
            self.svg.append("rect")
              .attr("class", "atual")
              .attr("x", 0)
              .attr("y", 0)
              // Começa sempre a 0
              .attr("width", escalaX(0))
              .attr("height", 50)
                .style("fill", "red");

            // Acrescenta uma barra para simbolizar a recta
            self.svg.append("rect")
              .attr("class", "meta")
              .attr("x", escalaX(meta))
              .attr("y", -10)
              .attr("width", 2)
              .attr("height", 70)
                .style("fill", "green");

            // Acrescenta texto para sinalizar a meta
            self.svg.append("text")
              .attr("class", "meta-text")
              // Menos uns pixeis para não sobrepor a barra
              .attr("x", escalaX(meta) - 3)
              .attr("y", -15)
              .attr("dy", ".71em")
                .style("text-anchor", "end")
                .style("fill", "black")
                .text("Meta");
        }


        /// <summary>
        /// Pinta a gauge de acordo com os valores atuais
        /// </summary>
        /// <param name="percentagem> Percentagem que vai ser pintada no arco </param>
        Gauge.prototype.DesenhaGauge = function (percentagem) {
            var self = this;


            // Definir angulo inicial do arco pintado
            arcStartRad = PercentagemParaRadianos(percentagemInicio);
            // Define angulo final do arco pintado
            // Divisão por dois devido a ser um arco e não uma circunferencia completa
            arcEndRad = arcStartRad + PercentagemParaRadianos(percentagem / 2);
            // Path do arco pintado calculado 
            arcPintado.startAngle(arcStartRad).endAngle(arcEndRad);


            /// Definimos o angulo final, neste caso meia circunferencia
            arcEndRad = PercentagemParaRadianos(0.5 + 0.75);
            // Path do arco vazio calculado
            arcVazio.startAngle(arcStartRad).endAngle(arcEndRad);


            //Meta divido por 2, por ser um arco e não uma circunferencia
            arcStartRad = PercentagemParaRadianos(meta / 2);
            // Adicionamos um valor minimo no angulo final para ser explicito
            arcEndRad = PercentagemParaRadianos((meta / 2 + 0.005));
            // Path do arco meta calculado
            arcMeta.startAngle(arcStartRad).endAngle(arcEndRad);

            // Angulo final é guardado como inicio do arco
            arcEndRad = PercentagemParaRadianos(percentagemInicio);

            // Atribuir paths
            grafico.select(".grafico-vazio").attr("d", arcVazio);
            grafico.select(".grafico-pintado").attr("d", arcPintado);
            grafico.select(".meta").attr("d", arcMeta).style("fill", "green");
            // texto com percentagem atual é acrescentado
            grafico.append("text").attr("class", "gauge-percentagem").attr("x", 0).attr("y", -5).style("font-size", "1.5em").style("fill", "black").style("text-anchor", "middle").text(percentagem + "%");
        }

        /// <summary>
        /// Cria uma transição nova com os dados que lhe são fornecidos
        /// Recebe um angulo novo e a partir do ultimo angulo conhecido calcula as posições a serem desenhadas 
        /// até chegar a esse destino
        /// </summary>
        /// <param name="elemento"> Elemento a aplicar o tween </param>
        /// <param name="anguloNovo"> Novo angulo final </param>
        Gauge.prototype.arcTween = function (elemento, anguloNovo) {

            // Transição customizada para os arcos
            elemento.attrTween("d", function (d) {
                // Atribuimos o ultimo angulo conhecido ao d.endAngle
                d.endAngle = arcEndRad

                // Constroi um novo conjunto de dados a começar no ultimo angulo conhecido até ao novo angulo
                // O valor do angulo é dividido devido ao desenho ser apenas meia circunferencia
                // É somado o valor 0.75 para este começar a partir da posição correcta de acordo com a visualização
                var interpolate = d3.interpolate(d.endAngle, PercentagemParaRadianos(anguloNovo / 2 + 0.75));
                return function (t) {
                    // Para cada valor de T, é utilizado a interpolação e dado um valor ao endAngle
                    d.endAngle = interpolate(t);
                    arcPintado.endAngle(d.endAngle);
                    // Guardado o ultimo valor caso haja outra tween
                    arcEndRad = d.endAngle;
                    // Retornamos o novo path
                    return arcPintado(d);
                };
            });

        }


        /// <summary>
        /// Desenha a meta no gráfico de acordo com os valores introduzidos
        /// </summary>
        Gauge.prototype.DesenhaMeta = function () {

            // Definir angulos para a meta, adicionado percentagemInicio para se 
            // encaixar dentro do arco de forma correta
            arcStartRadMeta = PercentagemParaRadianos(meta / 2 + percentagemInicio);
            arcEndRadMeta = PercentagemParaRadianos((meta / 2 + 0.005 + percentagemInicio));
            // Path do arco meta calculado
            arcMeta.startAngle(arcStartRadMeta).endAngle(arcEndRadMeta);

            // Atribuir o valor calculado
            grafico.select(".meta").attr("d", arcMeta).style("fill", "green");

        }


        /// <summary>
        /// Método que atualiza os elementos que representam os dados
        /// atualiza os elementos dentro do SVG do widget
        /// </summary>
        Gauge.prototype.Atualiza = function () {
            var self = this,
                textTween;

            if (modoVisualizacao === "arco") {
                // Vamos buscar os valores 
                // to-do
                //valorAtual = $(".valor-atual").val();
                //valorMaximo = $(".valor-maximo").val();
                //valorMinimo = $(".valor-minimo").val();
                //meta = $(".valor-meta").val();

                valorAtual = random ;
                valorMaximo = 100;
                valorMinimo = 0;
                meta = 50;

                // Caso valores não sejam numéricos
                if (!$.isNumeric(valorMaximo)) {
                    valorMaximo = 1;
                }
                if (!$.isNumeric(meta)) {
                    meta = 0;
                }
                if (!$.isNumeric(valorAtual)) {
                    valorAtual = 0;
                }

                // Calculada percentagem atual de acordo com os valores
                percentagem = (((valorAtual - valorMinimo) * 100) / (valorMaximo - valorMinimo)) / 100;
                // Calculada meta atual de acordo com os valores
                meta = (((meta - valorMinimo) * 100) / (valorMaximo - valorMinimo)) / 100;


                // Selecionar gráfico pintado
                d3.select("."+self.id).select(".grafico-pintado")
                    .transition()
                    .delay(50)
                    .duration(300)
                    // Chama a transição personalizada arcTween para desenhar a transição do arco
                    .call(self.arcTween, percentagem);

                textTween = function () {
                    // Cria nova interpolação desta vez, entre a atual percentagem, até ao valor final da percentagem
                    // Multiplicação por 100 devido ao angulo estar entre 0 e 1
                    var textInterpolate = d3.interpolate(parseInt(this.textContent), percentagem * 100);
                    // Modifica o valor de acordo com a interpolação
                    return function (t) { this.textContent = Number(textInterpolate(t)).toFixed(0) + "%"; }
                };


                d3.select("." + self.id).select(".gauge-percentagem")
                    .transition()
                    .duration(350)
                    // Chama a transição personalizada do texto
                    .tween("text", textTween);


                // Chamar método para desenhar a nova meta
                self.DesenhaMeta();
            }

            if (modoVisualizacao === "horizontal") {
                // Vamos buscar os valores
                valorAtual = $(".valor-atual").val();
                valorMaximo = $(".valor-maximo").val();
                valorMinimo = $(".valor-minimo").val();
                meta = $(".valor-meta").val();

                // Construimos novamente os eixos, com os valores novos
                self.ConstroiEixos();

                // Atualizamos o valor atual
                self.svg.select(".atual")
                    .transition()
                    .duration(300)
                    // Conforme a escala
                    .attr("width", escalaX(valorAtual));

                // Atualizar a meta
                self.svg.select(".meta")
                  // Conforme a escala
                  .attr("x", escalaX(meta));

                // Atualizar o texto Meta
                self.svg.select(".meta-text")
                   // Conforme a escala, menos pixies para não sobrepor
                  .attr("x", escalaX(meta) - 3);
            }

        }


        /// <summary>
        /// Atribui ao gráfico o seu modo de visualização e chama o método update
        /// </summary>
        Gauge.prototype.setModoVisualizacao = function (modo, id) {
            var self = this;

            // Atribui modo visualização
            modoVisualizacao = modo;


            // Caso o modo seja arco
            if (modoVisualizacao === "arco") {
                // Remover o atual
                d3.select("svg").remove();
                // Construir um novo
                self.ConstroiGrafico(id);
                // Atualizar
                self.Atualiza();
            }
            // Caso o modo seja horizontal
            if (modoVisualizacao === "horizontal") {
                // Remover o atual
                d3.select("svg").remove();
                // Construir um novo
                self.ConstroiGrafico(id);
                // Atualizar
                self.Atualiza();
            }

        }


        ///
        ///
        /// to-do
        Gauge.prototype.MostraOpcoes = function () {
            var self = this;

            $("body").append("<div id=\"myModal\" class=\"modal fade\">"  +
                "<div class=\"modal-dialog\">"  +
                "<div class=\"modal-content\">"  +
                "<div class=\"modal-header\">"  +
                "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">" + "&times;" + "</button>" +
                "<h4 class=\"modal-title\">" + "Opcoes da Gauge" + "</h4>" +
            "</div>" +
            "<div class=\"modal-body\">" +
                "<p>Selecione as suas opcoes</p>" +
                "<div class=\"gauge-selecionaOpcoes\">" +
                "</div>" +
            "</div>" +
            "<div class=\"modal-footer\">" +
                "<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">" + "Cancelar" + "</button>" +
                "<button type=\"button\" class=\"btn btn-primary\">" + "Escolher" + "</button>" +
            "</div>" + "</div>" + "</div>" + "</div>");

            $(".gauge-selecionaOpcoes").load("gauge-tabelaOpcoes.html .gauge-tabelaOpcoes");

            // Ligamos um botão para a "navbar" do widget
            $("." + self.id).find(".widget-navbar").append("<button type=\"button\"" + "class=\"gauge-opces\">" +
                                                           "<i class=\"glyphicon glyphicon-refresh\">" + "</i>" + "</button");

            // Ao pressionar modifica entre donut e não donut
            $("." + self.id).on("click", ".gauge-opces", function () {
                $("#myModal").modal("show");
            });
        }

        /// Retorna o objecto criado
        return Gauge;

    })();



    /// <summary>
    /// Classe KPI, label texto, label valor, etc
    /// Module Pattern
    /// </summary>
    var KPI = (function () {
        var TamanhoLimite = 350, /// to-do?
            valorTextTween,
            ligacao,
            cor,
            valor = 0,
            valorLimite = 50;



        /// <summary>
        /// Método construtor para a classe PieChart, chama o construtor do Widget 
        /// </summary>
        function KPI(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            var self = this;

            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);
            // Inicializar o raio
            self.raio = Math.min(self.largura, self.altura) / 2;
            // Inicializar toolTip a true
            self.mostraToolTip = true;

            self.valor = valor;
            self.valorLimite = valorLimite;
        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(KPI, Widget);


        /// <summary>
        /// Adapta os dados e acrescenta-os ao DOM, mais especificamente na secção do SVG
        /// </summary>
        KPI.prototype.InsereDados = function () {
            var self = this,
                textTween;

            // Começa o ciclo para atualizar os dados
            setInterval(function () {

                valorTextTween = random;

                // Seleciona o elemento to-do
                self.svg.select(".valorAtual")
                    .transition()
                    .duration(500)
                    // Chama a transição personalizada
                    .tween("text", self.TextTween);

                // to-do?
                self.setValor(random);
                self.VerificaValor();

            }, 1500);
        }


        /// <summary>
        /// Método para calcular transições personalizadas para elementos do tipo texto
        /// </summary>
        KPI.prototype.TextTween = function () {

            // Cria nova interpolação desta vez, entre a atual percentagem, até ao valor final da percentagem
            // Multiplicação por 100 devido ao angulo estar entre 0 e 1
            var textInterpolate = d3.interpolate(parseInt(this.textContent), valorTextTween);
            // Modifica o valor de acordo com a interpolação
            return function (t) { this.textContent = Number(textInterpolate(t)).toFixed(0); }

        }


        /// <summary>
        /// Compara o valor atual com o valor Limite, ao comparar pode modificar o elemento valorCompara para
        /// sinalizar o utilizar de melhor forma
        /// </summary>
        KPI.prototype.VerificaValor = function () {
            var self = this;

            // Caso o valor seja maior ou igual que o valor limite
            if (self.valor >= self.valorLimite) {
                self.svg.select(".valorCompara")
                    .transition()
                    // Aumentar raio do sinalizador
                    .attr("r", "12")
                      .style("fill", "green");
            } else {
                self.svg.select(".valorCompara")
                    .transition()
                    // Diminuir raio do sinalizador
                    .attr("r", "5")
                      .style("fill", "red");
            }
        }


        /// <summary>
        /// Cria um svg e acrescenta-o à DOM, atribui o selector à variável svg
        /// </summary>
        KPI.prototype.ConstroiSVG = function () {
            var self = this;


            // Seleciona o wrapper para inserir o svg
            self.svg = d3.select("." + self.id).select(".wrapper").insert("svg")
                // 80% para deixar algum espaço para as tooltip/legenda
                .attr("width", "100%")
                .attr("height", "100%")
                // Atribuida uma viewBox de acordo com o valor minimo de entro a sua altura ou largura
                .attr('viewBox', '0 0 ' + (Math.min(self.largura, self.altura)) + ' ' + (Math.min(self.largura, self.altura)))
                // Mantém a proporção de imagem independentemente do tamanho, e tenta sempre posiciona-la a meio
                .attr("preserveAspectRatio", "xMidYMid")
              .append("g")
                // Translação do raio minimo para estar dentro do svg de forma adequada 
                .attr("transform", "translate(" + (Math.min(self.largura, self.altura) / 2) + "," + (Math.min(self.largura, self.altura) / 2) + ")");

        }

        /// <summary>
        /// Constroi o HTML necessário para mostrar a informação ao utilizador
        /// </summary>
        KPI.prototype.ConstroiHTML = function (id) {
            var self = this;

            // Redefinimos a translação dos elementos para se enquadrarem no meio do SVG
            //self.svg.attr("transform", "translate(" + (self.largura / 2) + "," + (self.altura / 2) + ")");

            // Atribui class ao SVG
            d3.select("." + id).select(".wrapper").select("svg")
                .attr("class", "labelValor");

            // Insere texto que indica o nome do valor observado
            self.svg.insert("text")
                // Atribuir class
                .attr("class", "valorSelecionado")
                .attr("dy", "-2em")
                  .style("font-size", "1.5em")
                  .style("text-anchor", "middle")
                  //  Nome da variável
                  .text("Valor ID: ");

            // Insere texto que guarda valor atual
            self.svg.insert("text")
                .attr("class", "valorAtual")
                  .style("font-size", "3em")
                  .style("text-anchor", "middle")
                  // to-do?
                  .text(valor);

            // Insere texto que guarda valor Limite
            self.svg.insert("text")
                .attr("class", "valorLimite")
                .attr("dy", "3em")
                  .style("font-size", "1em")
                  .style("text-anchor", "middle")
                  .text("Valor Limite: " + self.valorLimite);

            // Insere circulo para melhor sinalizar estado dos dados
            self.svg.insert("circle")
                .attr("class", "valorCompara")
                .attr("cx", "3em")
                .attr("cy", "-1em")
                .attr("r", "10")
                  .style("fill", "grey");

        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do Elemento
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        KPI.prototype.ConstroiGrafico = function (id) {
            var self = this;

            // to-do
            // nome?
            // teste1?

            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("KPI");

            // Constroi SVG
            self.ConstroiSVG();
            // Constroi elementos necessários do HTML
            self.ConstroiHTML(id);
            // Começa o ciclo de busca de dados
            self.InsereDados();
            // Atualiza o valorLimite
            self.Atualiza();
        }


        /// <summary>
        /// Método que atualiza os elementos que representam os dados
        /// atualiza os elementos dentro do SVG do widget
        /// </summary>
        KPI.prototype.Atualiza = function () {
            var self = this;

            $(".update-KPI").click(function () {
                self.setValorLimite($(".valor-Limite").val());
                self.VerificaValor();
            });
        }


        /// <summary>
        /// Get e Set do atributo valor
        /// </summary>
        KPI.prototype.getValor = function () {
            var self = this;
            return self.valor;
        }
        KPI.prototype.setValor = function (valor) {
            this.valor = valor;
        }


        /// <summary>
        /// Get e Set do atributo valorLimite
        /// </summary>
        KPI.prototype.getValorLimite = function () {
            var self = this;
            return self.valorLimite;
        }
        KPI.prototype.setValorLimite = function (valorLimite) {
            var self = this;

            self.valorLimite = valorLimite;

            // Seleciona o elemento to-do
            self.svg.select(".valorLimite")
                // Chama a transição personalizada
                .text("Valor Limite: " + self.valorLimite);
        }


        /// Retorna o objecto criado
        return KPI;

    })();



    /// <summary>
    /// Classe Gráfico de Barras
    /// Module Pattern
    /// </summary>
    var PieChart = (function () {
        var TamanhoLimite = 350, /// to-do?
            /// to-do dataNest? series?
            dataNest,
            series,
            color,
            /// to-do ---------
            arc,
            pie,
            path,
            raio,
            donut = true;

        var fatias;


        /// <summary>
        /// Método construtor para a classe PieChart, chama o construtor do Widget 
        /// </summary>
        function PieChart(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            var self = this;

            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);
            // Inicializar o raio
            self.raio = Math.min(self.largura, self.altura) / 2;
            // Inicializar toolTip a true
            self.mostraToolTip = true;

            self.donut = false;

        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(PieChart, Widget);


        /// <summary>
        /// Cria um svg e acrescenta-o à DOM, atribui o selector à variável svg
        /// </summary>
        /// <param name="id"> Id do widget, utilizado para selecção do mesmo </param>
        PieChart.prototype.ConstroiSVG = function (id) {
            var self = this;

        
            // Seleciona o wrapper para inserir o svg
            self.svg = d3.select("." + id).select(".wrapper").insert("svg")
                // 80% para deixar algum espaço para as tooltip/legenda
                .attr("width", "80%")
                .attr("height", "100%")
                // Atribuida uma viewBox de acordo com o valor minimo de entro a sua altura ou largura
                .attr('viewBox', '0 0 ' + (Math.min(self.largura, self.altura)) + ' ' + (Math.min(self.largura, self.altura)))
                // Mantém a proporção de imagem independentemente do tamanho, e tenta sempre posiciona-la a meio
                .attr("preserveAspectRatio", "xMidYMid")
              .append("g")
                // Translação do raio minimo para estar dentro do svg de forma adequada 
                .attr("transform", "translate(" + (Math.min(self.largura, self.altura) / 2) + "," + (Math.min(self.largura, self.altura) / 2) + ")");
        }


        /// <summary>
        /// Adapta os dados e acrescenta-os ao DOM, mais especificamente na secção do SVG
        /// </summary>
        PieChart.prototype.InsereDados = function () {
            var self = this,
                soma = 0,
                somaAtual = 0,
                dadosPie = [0],
                percentagemSlice = [0];

            // to-do id?
            // dadosSelecionados
            // nome
            // teste1 / nome
            // Soma de todos os IDs

            // Agrupa os dados conforme a key selecionada
            dataNest = d3.nest()
                // Seleciona key para agrupar
                .key(function (d) { return d.id; })
                // Escolhe onde vai buscar os dados a agrupar
                .entries(self.dados);

            /// <summary>
            /// Este bloco é usado para descobrir a soma total de valores ( Soma )
            /// e para descobrir a soma de cada um dos conjuntos ( dadosPie[] )
            /// para no final podermos calcular a percentagem e então passar ao método
            /// arc para este calcular os angulos e finalmente desenhar o gráfico
            /// </summary>
            for (var a = 0; a < dataNest.length; a++) { // simple logic to calculate percentage data for the pie
                somaAtual = 0;
                // Percorre o conjunto de valores dentro do dataNest
                for (var b = 0; b < dataNest[a].values.length; b++) {
                    // Faz a soma do atual conjunto
                    somaAtual += dataNest[a].values[b].teste1;
                }
                // Soma total = a soma do atual
                soma += somaAtual;
                // A soma de um conjunto é guardado na percentagem
                dadosPie[a] = somaAtual;
            }

            // Para cada uma da soma dos conjuntos
            dadosPie.forEach(function (valorSlice, curIndex) {
                // Calculamos a percentagem e guardamos
                percentagemSlice[curIndex] = (valorSlice / soma) * 100;
            });

            // Método d3 que constroi uma função pie
            pie = d3.layout.pie()
                // Inserimos os valores de percentagem para proceder a construção
                .value(function (d, i) { return percentagemSlice[i]; })
                .sort(null);

            // Método d3 que constroi um arco
            self.arc = d3.svg.arc()
                // Raio interior ( 0 = circunferência completa )
                .innerRadius(0)
                // Raio exterior
                .outerRadius(self.raio);

            // Método d3 para definir as cores
            color = d3.scale.category10()
                // atribuimos a cada "key" uma cor
                .domain(d3.keys(self.dados[0]).filter(function (key) { return key === "id"; }));


            // Seleciona todos os path
            self.path = self.svg.selectAll("path")
                // utilizamos o pie para calcular os angulos e atribuimos a data
                .data(pie(dataNest))
              // Caso não hajam suficientes elementos para ligar aos dados são adicionados mais
              .enter().append("path")
                // Atribuido id a cada "fatia"
                .attr("id", function (d, i) { return "path" + i; })
                // Atribuida class slice ao elemento
                .attr("class", "slice")
                // Atribuida cor através do método color
                .attr("fill", function (d, i) { return color(i); })
                // É criado o path utilizando o método arc do d3
                .attr("d", self.arc);

            // Caso legendas esteja a true
            self.InsereLegenda(percentagemSlice);

        }

        /// <summary>
        /// Insere a legenda dinamicamente, de acordo com os dados fornecidos
        /// </summary>
        PieChart.prototype.InsereLegenda = function (dadosPie) {
            var self = this;

  
            // to-do Legendas
            // unico = id 
            $("."+self.id).append("<div class=\"legenda\" style=\"float:left; max-width:30px;\"></div>")

            // Insere SVG das legendas
            d3.select("."+self.id).select(".legenda").insert("svg")
                .attr("class", "svg-legenda")

            // Para cada conjunto de dados
            dadosPie.forEach(function (d, curIndex) {
                // Seleciona svg legenda
                d3.select("." + self.id).select(".legenda").select("svg")
                  // Insere um circulo para cada um dos conjuntos
                  .append("circle")
                    // Nome padrão é circulo legenda + o seu numero 
                    .attr("class", "circuloLegenda" + curIndex)
                    .attr("cx", 20)
                    .attr("cy", 20 + (curIndex * 20))
                    .attr("r", 5)
                    // É dado uma cor de acordo com o método color
                    .attr("fill", color(curIndex));
            });

            // Sempre que houver um hover numa das "fatias" principais
            $("."+self.id).find(".slice").hover(function () {
                // Selecionamos o circulo do conjunto com o mesmo numero
                d3.select("."+self.id).select(".circuloLegenda" + $(this).attr("id").match(/\d+/)).transition()
                    .duration(150)
                    // Aumenta-mos o tamanho
                    .attr("r", 10);
            },
            // Ao deixar de fazer hover
            function () {
                // Selecionamos o circulo do conjunto com o mesmo numero
                d3.select("."+self.id).select(".circuloLegenda" + $(this).attr("id").match(/\d+/)).transition()
                    // Volta ao mesmo tamanho
                    .attr("r", 5);
            }
            );

        }


        /// <summary>
        /// Método que atualiza o gráfico, p.ex a sua escala ou os dados
        /// </summary>
        PieChart.prototype.Atualiza = function () {
            var self = this
            // to-do
            // dadosSelecionados
            // nome
            // teste1 / numero

            // Update/Adição de elementos
            path.enter()
                .append("path")
                // arc calcula o path
                .attr("d", arc)
                .attr("fill", function (d) {
                    return color(d.data.nome);
                })

            // Update de elementos
            path.transition()
                .attr("d", arc);

            // Remoção de elementos
            path.exit()
                .transition()
                .remove();
        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção do gráfico
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        PieChart.prototype.ConstroiGrafico = function (id) {
            var self = this;

            // to-do
            // nome?
            // teste1?

            // Chama a função getDados
            // Transforma o texto de JSON para objecto, seleciona o objecto devolvido
            // Chama a função setDados para guardar o objecto
            //self.setDados($.parseJSON(getDados(self, "ficheiro")).dadosSelecionados);


            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("pieChart");

            self.ConstroiSVG(id);
            self.InsereDados();
            self.OpcaoDonut();

        }


        /// <summary>
        /// Método que atualiza os elementos que representam os dados
        /// atualiza os elementos dentro do SVG do widget
        /// </summary>
        PieChart.prototype.Atualiza = function () {
            var self = this;

            //to-do
            var atualizaPath = d3.select("."+self.id).selectAll(".slices").data(pie(dataNest));

            // Update de elementos
            self.path.transition()
                .attr("d", self.arc);

            // Remoção de elementos
            atualizaPath.exit()
                .remove()
                .transition();
        }


        /// <summary>
        /// Cria o botão e liga o evento de mudança de formato
        /// </summary>
        PieChart.prototype.OpcaoDonut = function ()  {
            var self = this;

            // Ligamos um botão para a "navbar" do widget
            $("." + self.id).find(".widget-navbar").append("<button type=\"button\"" + "class=\"piechart-donut\">" +
                                                           "<i class=\"glyphicon glyphicon-refresh\">" + "</i>" + "</button");

            // Ao pressionar modifica entre donut e não donut
            $("."+self.id).on("click",".piechart-donut", function () {
                self.setDonut();
            });
        }


        /// <summary>
        /// Set da função para definir se PieChart vai ter o formato "donut"
        /// </summary>
        PieChart.prototype.setDonut = function () {
            var self = this;


            self.donut = !self.donut;

            if (self.donut === true) {

                self.arc = d3.svg.arc()
                .innerRadius(self.raio / 2)
                .outerRadius(self.raio);

                self.Atualiza();

            } else {

                self.arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(self.raio);

                self.Atualiza();
            }
        }


        /// Retorna o objecto criado
        return PieChart;

    })();


    /// <summary>
    /// Classe Tabela
    /// Module Pattern
    /// </summary>
    var Tabela = (function () {

        // Vai guardar a referencia da dataTable
        var tabela,
            // opcoes para a tabela
            opcoesEstilo = { columnDefs: [] },
            // Nomes dos dados, to-do
            colunas = ["nome", "teste1", "id"],
            // Titulo das colunas
            tituloColunas = ["nome", "valores", "id"],
            // Também possível utilizar CDN - https://www.datatables.net/plug-ins/i18n/ (Lista de Linguagens)
            linguagem = {
                "sProcessing": "A processar...",
                "sLengthMenu": "Mostrar _MENU_ registos",
                "sZeroRecords": "Não foram encontrados resultados",
                "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registos",
                "sInfoEmpty": "Mostrando de 0 até 0 de 0 registos",
                "sInfoFiltered": "(filtrado de _MAX_ registos no total)",
                "sInfoPostFix": "",
                "sSearch": "Procurar:",
                "sUrl": "",
                "oPaginate": {
                    "sFirst": "Primeiro",
                    "sPrevious": "Anterior",
                    "sNext": "Seguinte",
                    "sLast": "Último"
                }
            },
            parseDate = d3.time.format("%y-%b-%d").parse;

        /// <summary>
        /// Método construtor para a classe Tabela, chama o construtor do Widget 
        /// </summary>
        function Tabela(titulo, widgetAltura, widgetLargura, widgetX, widgetY) {
            // Construtor de Widget é chamado
            Widget.call(this, titulo, widgetAltura, widgetLargura, widgetX, widgetY);
        };


        /// <summary>
        /// Herança é realizada através do método Herda
        /// </summary>
        Herda(Tabela, Widget);


        /// <summary>
        /// Adapta os dados e acrescenta-os ao plugin das dataTables
        /// </summary>
        Tabela.prototype.InsereDados = function (id) {
            var self = this;

            // Passar tudo para opcoes de estilo? to-do
            opcoesEstilo.columnDefs.push({
                targets: [1, 2],
                className: "dt-body-center"
            });

            // Selecionado o id da table
            self.tabela = $("." + self.id).find(".widget-table").DataTable({
                // Apontar para onde estão os dados
                data: self.dados,
                // Especificar as colunas to-do
                columns: self.ConstroiColuna(),
                "language": linguagem,
                // Menu que escolhe o numero de elementos a mostrar
                "aLengthMenu": [[5, 10, 15, -1], [5, 10, 15, "Todos"]],
                // Elementos a mostrar na página inicial
                "pageLength": 5,
                // Método para ligar as definições aqui to-do
                columnDefs: opcoesEstilo.columnDefs
            });

        }


        /// <summary>
        /// "Constroi" as colunas para inserir na tabela
        /// </summary>
        Tabela.prototype.ConstroiColuna = function () {
            var self = this,
                dados = d3.entries(self.dados),
                // Guarda a informação que vai ser enviada
                colunasTabela = [];

            // to-do enviar titulo da coluna?

            // Para cada "chave"/dados
            d3.keys(dados[0].value).forEach(function (valorColuna, curIndex) {
                console.log(valorColuna);
                // Adicionar ao array
                colunasTabela.push({
                    // O valor da key e o titulo a dar
                    data: valorColuna, title: valorColuna
                })
            })


            return colunasTabela;
        }


        /// <summary>
        /// Método que atualiza a tabela, p.ex a sua escala ou os dados
        /// </summary>
        Tabela.prototype.Atualiza = function () {
            var self = this

            // to-do

        }


        /// <summary>
        /// Encapsula todos os elementos necessários à construção da tabela
        /// </summary>
        /// <param name="id"> Id que identifica o widget para motivos de seleção </param>
        Tabela.prototype.ConstroiGrafico = function (id) {
            var self = this;
            
            // Chama a função getDados
            // Transforma o texto de JSON para objecto, seleciona o objecto devolvido
            // Chama a função setDados para guardar o objecto
            //self.setDados($.parseJSON(getDados(self, "ficheiro")).dadosSelecionados);


            // Adiciona classe do gráfico ao widget
            $("." + self.id).addClass("tabela");

            console.log(self.dados);

            // Para cada objecto vamos analisar a data
            self.dados.forEach(function (d) {
                // Analisa as datas e passa para um objecto do tipo Data
                d.date = parseDate(d.date);
                // Formata a data para um tipo mais legivel
                d.date = d.date.toDateString();
            })

            // Adiciona uma tabela base para aplicar as dataTables
            $("." + self.id).find(".widget-conteudo").append("<table " + "class=\"display widget-table\">" + "</table>")

            // Inserir dados na tabela
            self.InsereDados(id);
        }


        /// <summary>
        /// Esconde a coluna selecionada pelo utilizador
        /// </summary>
        Tabela.prototype.EscondeColuna = function (id, coluna) {
            var self = this;


            // to-do
            $(".escondeColuna").on("click", "li", function (e) {

                // Vai buscar o numero da coluna a remover
                var column = tabela.column($(this).find(".valor").attr("value"));

                // Inverte visibilidade
                column.visible(!column.visible());
            });

        }


        return Tabela;

    })();


    /// <summary>
    /// Class Grid, "tabela" que vai conter todos os widgets
    /// Module Pattern
    /// </summary>
    var Grid = (function () {

        var listaWidgets = [],
            grid,
            id,
            identificador,
            opcoes;


        /// <summary>
        /// Construtor da class Grid
        /// </summary>
        /// <param name="id"> Identificador da grid </param>
        /// <param name="opcoes"> Objecto com as opcoes para a inicializacao da grid </param>
        function Grid(id, opcoes) {
            var self = this;

            self.id = id;
            self.opcoes = opcoes;


            self.Inicializa();
        }


        /// <summary>
        /// Inicializa a "grid" com as opccoes que foram dadas pelo utilizador
        /// </summary>
        Grid.prototype.Inicializa = function () {

            var self = this;

            // Atribuição à variavel grid da referencia para a "grid"
            self.grid = $("#" + self.id);

            // Inicialização da "grid" com as opcoes enviadas no construtor
            self.grid.gridstack(self.opcoes);

            // Liga o evento de atualização ao fazer resize
            self.AtualizaWidgets();

            // Liga os eventos de modificar titulo e remove widget à "grid"
            self.RemoveWidget();

            // Liga o evento de guardar informação no Widget sempre que um é modificado
            self.GuardaInformacao();
        }


        /// <summary>
        /// Evento que vai atualizar todos os widgets na lista após o resize de algum deles
        /// </summary>
        Grid.prototype.AtualizaWidgets = function () {
            var self = this;

            $("#" + self.id).on('resizestop', function (event, ui) {
                setTimeout(function () {
                    listaWidgets.forEach(function (widget) {
                        widget.Atualiza();
                    })
                }, 20);
            });

        }

        /// <summary>
        /// Método para adicionar widgets à "grid"
        /// </summary>
        /// <param name="elemento"> Objeto com as caracteristicas do widget </param>
        Grid.prototype.AdicionaWidget = function (tipoWidget, titulo, x, y, width, height, autoPosition, minWidth, maxWidth,
        minHeight, maxHeight, id) {
            var self = this,
                $coordenadaX = $(".widgetCoordenadaX").val() || "0",
                $coordenadaY = $(".widgetCoordenadaY").val() || "0"

            // Dar titulo caso o recebido seja inválido
            if (titulo === undefined) titulo = "titulo";


            // Criação padrão do HTML do widget
            // Definimos um item da grid
            var el = "<div class=\"grid-stack-item \">" +
                     // Div do conteudo do item da grid
                     "<div class=\"grid-stack-item-content box " + "widget" + idUnico + "\">" +
                     // Wrapper para manter o conteudo 
                     // to-do idUnico melhor
                     // Navbar da widget
                     "<div class=\"widget-navbar\">" +
                        // Titulo do widget
                        "<span class=\"titulo\">" + titulo + "</span>" +
                        // Botões do widget
                        "<button type=\"button\" class=\"remove-widget\"><i class=\"glyphicon glyphicon-remove\"></i></button>" +
                        "<button type=\"button\" class=\"edita-widget\"><i class=\"glyphicon glyphicon-edit\"></i></button>" +
                     "</div>" +
                     "<div class=\"wrapper\">" +
                     // Conteudo do widget
                     "<div class=\"widget-conteudo\"> " +
                     "</div>" + "</div>" +
                     "<div class=\"legenda\">" + 
                     "</div>" + "</div> " + "</div>";


            // Atributo opcional, define uma posição automática para o widget
            // Ao modificar para fora, insere numa posição diferente
            // to-do
            //autoPosition = true;


            // Altura e largura minima para cada widget
            minHeight = minWidth = 4;
            
            // Impor limite no eixo do X para widget não sair fora dos limites
            if ($coordenadaX > 10) {
                $coordenadaX = 10;
            }

            // Impor limite no eixo do Y
            if ($coordenadaY >= 50) {
                $coordenadaY = 50;
            } 

            // Adiciona widget, biblioteca gridstack
            // apenas é obrigatório o atributo el
            self.grid.data("gridstack").addWidget(el, $coordenadaX, $coordenadaY, width, height, autoPosition, minWidth, maxWidth, minHeight, maxHeight, id);


            // to-do Factory de classes

            // Adicionamos o novo widget à lista de widgets atuais
            switch (tipoWidget) {
                case "area":
                    listaWidgets.push(new GraficoArea("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    // APAGAR - Apenas para teste do icon loading
                    listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "stacked")))
                    break;
                case "barras":
                    listaWidgets.push(new GraficoBarras("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    // APAGAR - Apenas para teste do icon loading
                    listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "stackedBar")));
                    break;
                case "linhas":
                    listaWidgets.push(new GraficoLinhas("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    // APAGAR - Apenas para teste do icon loading.dadosSelecionados)
                    listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "ficheiro")).dadosSelecionados)
                    break;
                case "gauge":
                    listaWidgets.push(new Gauge("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    break;
                case "kpi":
                    listaWidgets.push(new KPI("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    break;
                case "tabela":
                    listaWidgets.push(new Tabela("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    // APAGAR - Apenas para teste do icon loading
                    listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "stacked")))
                    break;
                case "pie":
                    listaWidgets.push(new PieChart("widget" + idUnico, "titulo", 20, 20, 400, 400));
                    // APAGAR - Apenas para teste do icon loading
                    listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "ficheiro")).dadosSelecionados)
                    break;
            }

            // APAGAR - Apenas para teste do icon loading
            //listaWidgets[idUnico].setDados($.parseJSON(getDados(listaWidgets[idUnico], "ficheiro")).dadosSelecionados)
            var idAuxiliar = idUnico;
            self.Constroi(listaWidgets, idAuxiliar);

            //// Constroi Gráfico no Widget
            //listaWidgets[idAuxiliar].ConstroiGrafico("widget" + idAuxiliar);
 
            // Incrementar para não haver Ids iguais
            idUnico++;

        }



        // APAGAR - Apenas para teste do icon loading
        // APAGAR - Apenas para teste do icon loading
        Grid.prototype.Constroi = function (listaWidgets, idAuxiliar) {
            setTimeout(function () {
                // Constroi Gráfico no Widget
                listaWidgets[idAuxiliar].ConstroiGrafico("widget" + idAuxiliar);
            }, 20);
        }

        /// <summary>
        /// Método para guardar a informação atual dos widgets sempre que algum é atualizado
        /// </summary>
        Grid.prototype.GuardaInformacao = function () {
            //$('.grid-stack-item.ui-draggable').each(function () {
            //    var $this = $(this);
            //    items.push({
            //        x: $this.attr('data-gs-x'),
            //        y: $this.attr('data-gs-y'),
            //        w: $this.attr('data-gs-width'),
            //        h: $this.attr('data-gs-height'),
            //        content: $('.grid-stack-item-content', $this).html()
            //    });
            //});


            // ATUAL to-do
            listaWidgets.forEach(function (item, curIndex) {
                var $this = $(".widget" + listaWidgets[idUnico]);
                
            });
        }


        /// <summary>
        /// Evento que vai remover o widget da grid
        /// </summary>
        Grid.prototype.RemoveWidget = function (el) {
            var self = this;

            // Ao clickar em qualquer botão de classe remove-widget
            $(document).on("click", ".remove-widget", function () {

                // Selecionar o elemento "grid-stack-item" mais próximo do botão, seleção do widget especifico do botão
                var el = $(this).closest(".grid-stack-item");

                // Chamar a grid e o método da biblioteca do gridstack para remover o widget
                self.grid.data("gridstack").removeWidget(el);
            });
        }

        return Grid;

    })();


    options = {
        verticalMargin: 2,
        float: true,
        // Modificado também nas media queries
        minWidth: 680,
        acceptWidgets: ".grid-stack-item",
        resizable: {
            handles: "sw, se"
        }
    };

    gridPrincipal = new Grid("main-gridstack", options);

    // Ao fazer "keyup" verifica se o valor é valido na coordenada X
    $(".widgetCoordenadaX").keyup(function () {
        var valorX = $(".widgetCoordenadaX").val() || "0";

        // Verifica se valorX é inteiro
        if (confirmaInteiro(valorX) === true) {
            $(".widgetLabelX").text("");
        } else {
            $(".widgetLabelX").text("Erro, digite um número inteiro");
        }

    });

    // Ao fazer "keyup" verifica se o valor é valido na coordenada Y
    $(".widgetCoordenadaY").keyup(function () {
        var valorY = $(".widgetCoordenadaY").val() || "0";

        // Verifica se valorY é inteiro
        if (confirmaInteiro(valorY) === true) {
            $(".widgetLabelY").text("");
        } else {
            $(".widgetLabelY").text("Erro, digite um número inteiro");
        }

    });


    // Botão de adicionar widget
    $(".adicionaWidget").click(function () {
        var valorX = $(".widgetCoordenadaX").val() || "0",
            valorY = $(".widgetCoordenadaY").val() || "0";

        // Se ambos os valores forem inteiro
        if (confirmaInteiro(valorX) === true && confirmaInteiro(valorY) === true) {
            // Adicionar widget de acordo com opção na dropdown
            gridPrincipal.AdicionaWidget($(".adicionaWidget-tipo").find(":selected").val());
        }

    });


})