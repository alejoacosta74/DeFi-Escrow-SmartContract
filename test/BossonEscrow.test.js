const BossonCoin = artifacts.require("BossonCoin");
const BossonEscrow = artifacts.require("BossonEscrow");

require('chai')
.use(require('chai-as-promised'))
.should()

function tokens(n){
    return web3.utils.toWei(n, 'ether')
}

contract ('bosson escrow contract', (accounts) => {
    let _bossoncoin , _bossonescrow 
    let  coinDeployer = accounts[0]
    let escrowAgent = accounts[1]
    let buyer1 = accounts[2]
    let buyer2 = accounts[3]
    let seller1 = accounts[4]
    let seller2 = accounts[5]

    before (async () => {
        //load contracts
        _bossoncoin = await BossonCoin.new({from: coinDeployer})
        _bossonescrow = await BossonEscrow.new(_bossoncoin.address, {from: escrowAgent})
        
        //initialize buyer1 and buyer2 BossonCoin balance to 100
        _bossoncoin.transfer(buyer2, 100, {from: coinDeployer});
    })

    describe ('BossonCoin deployment', async() => {
        it ('has a name', async ()=> {
            const name = await _bossoncoin.name();
            assert.equal(name, "Bosson Coin");
        })
        //check buyer1 initial balance is set to 100 BossonCoins
        it('transfer 100 coins to buyer1', async ()=> {
            let result;
            result = await _bossoncoin.balanceOf(buyer1);
            assert.equal(result, 0, "Buyer1 balance is correct before initial funding");
            _bossoncoin.transfer(buyer1, 100, {from: coinDeployer});
            result = await _bossoncoin.balanceOf(buyer1);
            assert.equal(result, 100, "Buyer1 balance is correct after initial funding");
        })
        it('updated balance of BossonCoin contract owner after funding buyer1 and buyer2', async ()=> {
            let result;
            result = await _bossoncoin.balanceOf(coinDeployer);
            assert.equal(result, 999800, "BossonCoin contract owner balance is correctly updated after funding buyers");
        })
    })
    describe ('BossoneScrow deployment', async() => {
        it ('has a name', async ()=> {
            const name = await _bossonescrow.name();
            assert.equal(name, "Bosson escrow contract");
        })
        it ('Seller1 offers coffe for 3 coins', async ()=> {
            await _bossonescrow.offer(seller1, "coffee", 3, 10)
            item = await _bossonescrow.stock("coffee")
            itemName = item.name;
            assert.equal(itemName, "coffee", "correctly added coffee to stock")
        })
        it ('Escrow agent should not be able to transfer without buyer allowance', async ()=> {
            const truffleAssert = require('truffle-assertions')
            await truffleAssert.reverts(_bossonescrow.credit(buyer1, 20, {from: escrowAgent}))        
        })
        it ('transfers BossonCoins from buyer1 to Escrow account', async ()=> {            
            await _bossoncoin.approve(_bossonescrow.address, 20, {from: buyer1})
            await _bossonescrow.credit(buyer1, 20, {from: escrowAgent})
            balance = await _bossonescrow.checkescrowBalance(buyer1)
            assert.equal(balance, 20, "balance should be 20")
        })
        it ('Buyer places order to buy coffee', async ()=> {            
            await _bossonescrow.order(buyer1, "coffee", {from: escrowAgent})
            balance = await _bossonescrow.checkescrowBalance(buyer1)
            assert.equal(balance, 17, "balance should be 17")
            balance = await _bossonescrow.checkescrowBalance(seller1)
            assert.equal(balance, 3, "balance should be 3")
        })
        it ('Buyer confirms coffee payment', async ()=> {            
            await _bossonescrow.complete(buyer1, "coffee", {from: escrowAgent})
            balance = await _bossoncoin.balanceOf(seller1)
            assert.equal(balance, 3, "balance should be 3")
            item = await _bossonescrow.getItem("coffee")        
            assert.equal(item.buyer, buyer1)
        })
    })

})