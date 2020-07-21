import React from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      deck: [],
      dealer: null,
      player: null,
      balance: 0,
      inputVal: '',
      currentBet: null,
      gameOver: false,
      message: null,
    };
  }

  generateDeck() {
    const cards = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
    const suits = ['♦','♣','♥','♠'];
    const deck = [];
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < suits.length; j++) {
        deck.push({number: cards[i], suit: suits[j]});
      }
    }
    return deck;
  }
  
  dealCards(deck) {
    const playerCard1 = this.getRandomCard(deck);
    const dealerCard1 = this.getRandomCard(playerCard1.updatedDeck);
    const playerCard2 = this.getRandomCard(dealerCard1.updatedDeck);    
    const playerStartingHand = [playerCard1.randomCard, playerCard2.randomCard];
    const dealerStartingHand = [dealerCard1.randomCard, {}];
    
    const player = {
      cards: playerStartingHand,
      count: this.getCount(playerStartingHand)
    };
    const dealer = {
      cards: dealerStartingHand,
      count: this.getCount(dealerStartingHand)
    };
    
    return {updatedDeck: playerCard2.updatedDeck, player, dealer};
  }

  startNewGame(type) {
    if (type === 'continue') {
      if (this.state.balance > 0) {
        const deck = (this.state.deck.length < 10) ? this.generateDeck() : this.state.deck;
        const { updatedDeck, player, dealer } = this.dealCards(deck);

        this.setState({
          deck: updatedDeck,
          dealer,
          player,
          currentBet: null,
          gameOver: false,
          message: null
        });
      } else {
        this.setState({ message: 'GAME OVER! Insufficient balance.' });
      }
    } else {
      const deck = this.generateDeck();
      const { updatedDeck, player, dealer } = this.dealCards(deck);

      this.setState({
        deck: updatedDeck,
        dealer,
        player,
        balance: 500,
        inputVal: '',
        currentBet: null,
        gameOver: false,
        message: null
      });
    }
  }
       
  getRandomCard(deck) {
    const updatedDeck = deck;
    const randomIndex = Math.floor(Math.random() * updatedDeck.length);
    const randomCard = updatedDeck[randomIndex];
    updatedDeck.splice(randomIndex, 1);

    return { randomCard, updatedDeck };
  }
  
  placeBet() {
    const currentBet = this.state.inputVal;

    if (currentBet > this.state.balance) {
      this.setState({ message: 'Insufficient Balance!' });
    } else if (currentBet % 1 !== 0) {
      this.setState({ message: 'Error: Incorrect Amount. Please bet whole numbers only.' });
    } else {
      // currentBet - currentBalance
      const balance = this.state.balance - currentBet;
      this.setState({ balance, inputVal: '', currentBet });
    }
  }
  
  hit() {
    if (!this.state.gameOver) {
      if (this.state.currentBet) {
        const { randomCard, updatedDeck } = this.getRandomCard(this.state.deck);
        const player = this.state.player;
        player.cards.push(randomCard);
        player.count = this.getCount(player.cards);

        if (player.count > 21) {
          this.setState({ player, gameOver: true, message: 'You are BUSTED!' });
        } else {
          this.setState({ deck: updatedDeck, player });
        }
      } else {
        this.setState({ message: 'No bet placed.' });
      }
    } else {
      this.setState({ message: 'GAME OVER' });
    }
  }
  
  dealerDraw(dealer, deck) {
    const { randomCard, updatedDeck } = this.getRandomCard(deck);
    dealer.cards.push(randomCard);
    dealer.count = this.getCount(dealer.cards);
    return { dealer, updatedDeck };
  }
  
  getCount(cards) {
    const rearranged = [];
    cards.forEach(card => {
      if (card.number === 'A') {
        rearranged.push(card);
      } else if (card.number) {
        rearranged.unshift(card);
      }
    });
    
    return rearranged.reduce((total, card) => {
      if (card.number === 'J' || card.number === 'Q' || card.number === 'K') {
        return total + 10;
      } else if (card.number === 'A') {
        return (total + 11 <= 21) ? total + 11 : total + 1;
      } else {
        return total + card.number;
      }
    }, 0);
  }
  
  stand() {
    if (!this.state.gameOver) {
      //Dealer's 2nd card
      const randomCard = this.getRandomCard(this.state.deck);
      let deck = randomCard.updatedDeck;
      let dealer = this.state.dealer;
      dealer.cards.pop();
      dealer.cards.push(randomCard.randomCard);
      dealer.count = this.getCount(dealer.cards);

      // Keep drawing cards until count is 17 or more
      while(dealer.count < 17) {
        const draw = this.dealerDraw(dealer, deck);
        dealer = draw.dealer;
        deck = draw.updatedDeck;
      }

      if (dealer.count > 21) {
        this.setState({
          deck,
          dealer,
          balance: this.state.balance + this.state.currentBet * 2,
          gameOver: true,
          message: 'Dealer BUSTED! You won.'
        });
      } else {
        const winner = this.getWinner(dealer, this.state.player);
        let balance = this.state.balance;
        let message;
        
        if (winner === 'dealer') {
          message = 'Dealer won!';
        } else if (winner === 'player') {
          balance += this.state.currentBet * 2;
          message = 'Congratulations! You won.';
        } else {
          balance += this.state.currentBet;
          message = 'Push';
        }
        
        this.setState({
          deck, 
          dealer,
          balance,
          gameOver: true,
          message
        });
      } 
    } else {
      this.setState({ message: 'GAME OVER!' });
    }
  }
  
  getWinner(dealer, player) {
    if (dealer.count > player.count) {
      return 'dealer';
    } else if (dealer.count < player.count) {
      return 'player';
    } else {
      return 'push';
    }
  }

  formPreventDefault(e) {
    e.preventDefault();
  }

  componentDidMount() {
    this.startNewGame();
  }
    
  render() {
    if (!this.state.dealer) return null;
    let dealerCount;
    const card1 = this.state.dealer.cards[0].number;
    const card2 = this.state.dealer.cards[1].number;
    if (card2) {
      dealerCount = this.state.dealer.count;
    } else {
      if (card1 === 'J' || card1 === 'Q' || card1 === 'K') {
        dealerCount = 10;
      } else if (card1 === 'A') {
        dealerCount = 11;
      } else {
        dealerCount = card1;
      }
    }

    return (
      <div>
        <div className="buttons mb-3">
          <button type="button" className="btn btn-outline-text-dark bg-light text-uppercase" onClick={() => { this.startNewGame() }}>New Game</button>
          <div className="options mt-1">
            <button type="button" className="btn btn-outline-success" onClick={() => {this.hit()}}>Hit</button>
            <button type="button" className="btn btn-outline-warning" onClick={() => { this.stand() }}>Stand</button>
          </div>
        </div>
        
        <p>Current Balance: £{ this.state.balance }</p>
        {
          !this.state.currentBet ? 
            <div className="currentBet">
              <form onSubmit={(e)=>this.formPreventDefault(e)}>
                <div className="form-inline">
                  <input type="text" name="bet" className="form-control" placeholder="£0" value={this.state.inputVal} onChange={(e) => this.setState({inputVal: e.target.value})}/>
                  <button type="button" className="form-control btn btn-outline-danger" onClick={() => {this.placeBet()}}>Place Bet</button>
                </div>
            </form>
          </div>
          : null
        }
        {
          this.state.gameOver ?
          <div className="buttons">
            <button type="button" className="btn btn-outline-primary" onClick={() => {this.startNewGame('continue')}}>Continue</button>
          </div>
          : null
        }
        <p>{ this.state.message }</p>

        <div className="gameTable">
          <p>Your Points: { this.state.player.count }</p>
          <div className="cards mb-3">
              { this.state.player.cards.map((card, i) => {
                return <Card key={i} number={card.number} suit={card.suit}/>
              }) }
          </div>
          
          <p>Dealer's Points: { this.state.dealer.count }</p>
          <div className="cards">
              { this.state.dealer.cards.map((card, i) => {
                return <Card key={i} number={card.number} suit={card.suit}/>;
              }) }
          </div>
          
        </div>

        <h5 className="pt-4">BlackJack Game Table</h5>

      </div>
    );
  }
};

const Card = ({ number, suit }) => {
  const cardFace = (number) ? `${number}${suit}` : null;
  const color = (suit === '♦' || suit === '♥') ? 'redCard' : 'blackCard';
  
  return (
    <div className={color}>
        { cardFace }
      </div>
  );
};

export default App;