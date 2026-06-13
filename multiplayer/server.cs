using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using System.Threading;

namespace MultiplayerServer
{
    class Program
    {
        private static readonly GameState Game = new GameState();
        private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();

        static void Main(string[] args)
        {
            if (!HttpListener.IsSupported)
            {
                Console.WriteLine("HttpListener não é suportado neste computador.");
                return;
            }

            var listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:8003/");
            listener.Start();
            Console.WriteLine("Servidor multiplayer rodando em http://localhost:8003/");

            while (true)
            {
                var context = listener.GetContext();
                ThreadPool.QueueUserWorkItem(HandleRequest, context);
            }
        }

        private static void HandleRequest(object state)
        {
            var context = (HttpListenerContext)state;
            try
            {
                var path = context.Request.Url.LocalPath.TrimStart('/');
                if (string.IsNullOrEmpty(path))
                {
                    ServeFile(context, "index.html");
                    return;
                }

                if (path.StartsWith("api/"))
                {
                    HandleApi(context, path.Substring(4));
                    return;
                }

                ServeFile(context, path);
            }
            catch (Exception ex)
            {
                SendJson(context, new Dictionary<string, object> { { "error", ex.Message } }, 500);
            }
        }

        private static void HandleApi(HttpListenerContext context, string action)
        {
            switch (action)
            {
                case "state":
                    var playerName = context.Request.QueryString["playerName"] ?? string.Empty;
                    SendJson(context, Game.GetPublicState(playerName), 200);
                    return;
                case "join":
                    if (context.Request.HttpMethod != "POST")
                    {
                        SendJson(context, new Dictionary<string, object> { { "error", "Método inválido." } }, 405);
                        return;
                    }

                    var body = ReadBody(context.Request);
                    var joinData = Json.Deserialize<Dictionary<string, object>>(body);
                    var name = joinData.ContainsKey("playerName") ? joinData["playerName"].ToString() : "Jogador";
                    var players = joinData.ContainsKey("maxPlayers") ? Convert.ToInt32(joinData["maxPlayers"]) : 2;
                    var avatar = joinData.ContainsKey("avatar") ? joinData["avatar"].ToString() : "🙂";
                    SendJson(context, Game.JoinPlayer(name, players, avatar), 200);
                    return;
                case "select":
                    if (context.Request.HttpMethod != "POST")
                    {
                        SendJson(context, new Dictionary<string, object> { { "error", "Método inválido." } }, 405);
                        return;
                    }

                    body = ReadBody(context.Request);
                    var selectData = Json.Deserialize<Dictionary<string, object>>(body);
                    name = selectData.ContainsKey("playerName") ? selectData["playerName"].ToString() : string.Empty;
                    var cardId = selectData.ContainsKey("cardId") ? Convert.ToInt32(selectData["cardId"]) : -1;
                    SendJson(context, Game.SelectCard(name, cardId), 200);
                    return;
                case "reset":
                    if (context.Request.HttpMethod != "POST")
                    {
                        SendJson(context, new Dictionary<string, object> { { "error", "Método inválido." } }, 405);
                        return;
                    }

                    Game.Reset();
                    SendJson(context, Game.GetPublicState(string.Empty), 200);
                    return;
                default:
                    SendJson(context, new Dictionary<string, object> { { "error", "Ação desconhecida." } }, 404);
                    return;
            }
        }

        private static void ServeFile(HttpListenerContext context, string fileName)
        {
            var root = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
            var filePath = Path.Combine(root, fileName.Replace('/', Path.DirectorySeparatorChar));
            Console.WriteLine("[ServeFile] request '" + fileName + "' => '" + filePath + "'");
            if (!File.Exists(filePath))
            {
                Console.WriteLine("[ServeFile] arquivo não encontrado: '" + filePath + "'");
                context.Response.StatusCode = 404;
                context.Response.Close();
                return;
            }

            var bytes = File.ReadAllBytes(filePath);
            context.Response.ContentType = GetContentType(filePath);
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.Close();
        }

        private static string ReadBody(HttpListenerRequest request)
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                return reader.ReadToEnd();
            }
        }

        private static void SendJson(HttpListenerContext context, object payload, int statusCode)
        {
            var content = Json.Serialize(payload);
            var bytes = Encoding.UTF8.GetBytes(content);
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.Close();
        }

        private static string GetContentType(string path)
        {
            if (path.EndsWith(".css", StringComparison.OrdinalIgnoreCase)) return "text/css";
            if (path.EndsWith(".js", StringComparison.OrdinalIgnoreCase)) return "application/javascript";
            if (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) return "text/html";
            return "application/octet-stream";
        }
    }

    public class GameState
    {
        private readonly List<Player> players = new List<Player>();
        private readonly List<Card> cards = new List<Card>();
        private int currentPlayerIndex = 0;
        private int maxPlayers = 2;
        private readonly List<int> selectedCards = new List<int>();
        public bool IsGameOver { get; private set; }
        public string Loser { get; private set; }

        public GameState()
        {
            IsGameOver = false;
            Loser = string.Empty;
        }

        public object JoinPlayer(string name, int maxPlayers, string avatar)
        {
            if (string.IsNullOrEmpty(name)) name = "Jogador";
            if (maxPlayers < 2) maxPlayers = 2;
            if (maxPlayers > 5) maxPlayers = 5;

            if (players.Count >= maxPlayers)
            {
                return new Dictionary<string, object> { { "error", "Número máximo de jogadores já atingido." } };
            }

            if (players.Exists(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
            {
                name = name + "_" + (players.Count + 1);
            }

            this.maxPlayers = maxPlayers;
            players.Add(new Player(Guid.NewGuid(), name, avatar));
            if (players.Count == maxPlayers && cards.Count == 0)
            {
                InitializeCards();
            }

            return GetPublicState(name);
        }

        public object SelectCard(string playerName, int cardId)
        {
            if (string.IsNullOrEmpty(playerName))
            {
                return new Dictionary<string, object> { { "error", "Jogador inválido." } };
            }

            var playerIndex = players.FindIndex(p => p.Name.Equals(playerName, StringComparison.OrdinalIgnoreCase));
            if (playerIndex == -1)
            {
                return new Dictionary<string, object> { { "error", "Jogador não encontrado." } };
            }

            if (playerIndex != currentPlayerIndex)
            {
                return new Dictionary<string, object> { { "error", "Não é a sua vez." } };
            }

            if (IsGameOver)
            {
                return new Dictionary<string, object> { { "error", "O jogo já acabou." } };
            }

            var card = cards.Find(c => c.Id == cardId);
            if (card == null || card.Flipped || card.Matched)
            {
                return new Dictionary<string, object> { { "error", "Carta inválida." } };
            }

            card.Flipped = true;
            selectedCards.Add(cardId);

            if (selectedCards.Count == 2)
            {
                var first = cards.Find(c => c.Id == selectedCards[0]);
                var second = cards.Find(c => c.Id == selectedCards[1]);
                CheckSelection(players[playerIndex].Name, first, second);
                selectedCards.Clear();
            }

            return GetPublicState(playerName);
        }

        public object GetPublicState(string playerName)
        {
            return new Dictionary<string, object>
            {
                { "players", players.ConvertAll(p => new Dictionary<string, object> { { "name", p.Name }, { "avatar", p.Avatar } }).ToArray() },
                { "scores", GetScores() },
                { "currentPlayer", players.Count > 0 ? players[currentPlayerIndex].Name : string.Empty },
                { "cards", GetCards() },
                { "maxPlayers", maxPlayers },
                { "isGameOver", IsGameOver },
                { "loser", Loser }
            };
        }

        private Dictionary<string, int> GetScores()
        {
            var scores = new Dictionary<string, int>();
            foreach (var player in players)
            {
                scores[player.Name] = player.Score;
            }
            return scores;
        }

        private object[] GetCards()
        {
            var result = new object[cards.Count];
            for (var i = 0; i < cards.Count; i++)
            {
                var card = cards[i];
                result[i] = new Dictionary<string, object>
                {
                    { "id", card.Id },
                    { "type", card.Type },
                    { "emoji", card.Emoji },
                    { "flipped", card.Flipped },
                    { "matched", card.Matched }
                };
            }
            return result;
        }

        public void Reset()
        {
            cards.Clear();
            players.Clear();
            currentPlayerIndex = 0;
            selectedCards.Clear();
            IsGameOver = false;
            Loser = string.Empty;
        }

        private void InitializeCards()
        {
            var animals = new[]
            {
                new string[] {"Leão","🦁","🦁"},
                new string[] {"Tigre","🐅","🐅"},
                new string[] {"Zebra","🦓","🦓"},
                new string[] {"Gato","🐱","😺"},
                new string[] {"Cachorro","🐶","🐕"},
                new string[] {"Urso","🧸","🐻"},
                new string[] {"Panda","🐼","🐼"},
                new string[] {"Coelho","🐰","🐇"},
                new string[] {"Raposa","🦊","🦊"},
                new string[] {"Lobo","🐺","🐺"},
                new string[] {"Cabra","🐐","🐐"},
                new string[] {"Vaca","🐄","🐂"},
                new string[] {"Porco","🐷","🐷"},
                new string[] {"Ovelha","🐑","🐑"},
                new string[] {"Cavalo","🐴","🐎"},
                new string[] {"Camelo","🐫","🐪"},
                new string[] {"Girafa","🦒","🦒"},
                new string[] {"Elefante","🐘","🐘"},
                new string[] {"Rinoceronte","🦏","🦏"},
                new string[] {"Hipopótamo","🦛","🦛"},
                new string[] {"Chimpanzé","🐵","🐵"},
                new string[] {"Macaco","🐒","🐒"},
                new string[] {"Avestruz","🐦","🐦"},
                new string[] {"Flamingo","🦩","🦩"}
            };

            var list = new List<Card>();
            for (var index = 0; index < animals.Length; index++)
            {
                var animal = animals[index];
                list.Add(new Card(index * 2, "animal", animal[0], animal[1], false, false));
                list.Add(new Card(index * 2 + 1, "animal", animal[0], animal[2], false, false));
            }

            list.Add(new Card(animals.Length * 2, "joker", "Coringa", "🎭", false, false));
            var rnd = new Random();
            while (list.Count > 0)
            {
                var pick = rnd.Next(list.Count);
                cards.Add(list[pick]);
                list.RemoveAt(pick);
            }
        }

        private void CheckSelection(string playerName, Card first, Card second)
        {
            if (first.Type == "joker" || second.Type == "joker")
            {
                first.Flipped = false;
                second.Flipped = false;
                currentPlayerIndex = (currentPlayerIndex + 1) % players.Count;
                return;
            }

            if (first.Name == second.Name && first.Id != second.Id)
            {
                first.Matched = true;
                second.Matched = true;
                var player = players.Find(p => p.Name.Equals(playerName, StringComparison.OrdinalIgnoreCase));
                if (player != null)
                {
                    player.Score += 1;
                }

                var unmatched = cards.FindAll(c => !c.Matched);
                if (unmatched.Count == 1 && unmatched[0].Type == "joker")
                {
                    IsGameOver = true;
                    var loserIndex = (currentPlayerIndex + 1) % players.Count;
                    Loser = players[loserIndex].Name;
                }
            }
            else
            {
                first.Flipped = false;
                second.Flipped = false;
                currentPlayerIndex = (currentPlayerIndex + 1) % players.Count;
            }
        }
    }

    public class Player
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string Avatar { get; private set; }
        public int Score { get; set; }

        public Player(Guid id, string name, string avatar)
        {
            Id = id;
            Name = name;
            Avatar = string.IsNullOrEmpty(avatar) ? "🙂" : avatar;
            Score = 0;
        }
    }

    public class Card
    {
        public int Id { get; private set; }
        public string Type { get; private set; }
        public string Name { get; private set; }
        public string Emoji { get; private set; }
        public bool Flipped { get; set; }
        public bool Matched { get; set; }

        public Card(int id, string type, string name, string emoji, bool flipped, bool matched)
        {
            Id = id;
            Type = type;
            Name = name;
            Emoji = emoji;
            Flipped = flipped;
            Matched = matched;
        }
    }
}
