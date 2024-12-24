<template>
    <div>
      <el-upload style="margin-top:100px" action="" drag accept=".autosave"
                 :before-upload="getUploadFile">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将.autosave文件拖到此处</div>
      </el-upload>
        <div>
            <el-input
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 4}"
                    placeholder="请输入内容"
                    v-model="jsonTxt">
            </el-input>
            <el-button @click="parsing">解析</el-button>
        </div>
        <div v-if="jsonTxt && isInit">
            <h2>状态</h2>
            <div class="role">
                <span>当前生命</span>
                <el-input class="input" placeholder="请输入当前生命" v-model="jsonObj.current_health"></el-input>
                <span>最大生命</span>
                <el-input class="input" placeholder="请输入最大生命" v-model="jsonObj.max_health"></el-input>
                <span>金币数量</span>
                <el-input class="input" placeholder="请输入金币数量" v-model="jsonObj.gold"></el-input>
                <span>费用数量</span>
                <el-input class="input" placeholder="请输入费用数量" v-model="jsonObj.red"></el-input>
            </div>
            <h2>药水</h2>
            <div class="role">
                <el-select v-for="(i, index) in jsonObj.potions" :key="index + i" v-model="jsonObj.potions[index]"
                           placeholder="请选择">
                    <el-option v-for="item in dropAllPotions" :key="item" :label="potionNameFormatter(item)"
                               :value="item">
                    </el-option>
                </el-select>
            </div>
            <div class="flex-row">
                <div style="width:50%">
                    <h2>卡片</h2>
                    <el-button type="primary" @click="dialogCardsVisible = true">添加卡片</el-button>
                    <el-button type="success" style="margin-left:50px" @click="upgradeSelectedCards">升级选中
                    </el-button>
                    <el-button type="danger" style="margin-left:50px" @click="deleteSelectedCards">删除选中</el-button>
                    <el-table :data="jsonObj.cards" @selection-change="onCardsSelectionChange" ref="cardsTable">
                        <el-table-column header-align="center" type="selection">
                        </el-table-column>
                        <el-table-column prop="id" header-align="center" label="id">
                        </el-table-column>
                        <el-table-column header-align="center" :formatter="cardsNameObjectFormatter" label="name">
                        </el-table-column>
                        <el-table-column header-align="center" prop="upgrades" label="upgrades">
                        </el-table-column>
                    </el-table>
                </div>

                <div style="width:50%">
                    <h2>遗物</h2>
                    <el-button type="primary" @click="dialogRelicsVisible = true">添加遗物</el-button>
                    <el-button type="danger" style="margin-left:50px" @click="deleteSelectedRelics">删除选中</el-button>
                    <el-table :data="jsonObj.relics" @selection-change="onRelicsSelectionChange">
                        <el-table-column header-align="center" type="selection">
                        </el-table-column>
                        <el-table-column header-align="center" :formatter="singleFormatter" label="id">
                        </el-table-column>
                        <el-table-column header-align="center" :formatter="relicsNameFormatter" label="name">
                        </el-table-column>
                    </el-table>
                </div>
            </div>

            <el-button type="primary" style="margin-top:30px;margin-bottom:30px" @click="exportFile">生成存档编码
            </el-button>
            <el-button type="primary" style="margin-top:30px;margin-bottom:30px" @click="copyData">复制Json到剪贴板
            </el-button>

            <el-dialog :title="inputCardTitle" v-model="dialogCardsVisible">
                <el-input v-model="filterCards" clearable placeholder="过滤卡片 id / name"></el-input>
                <el-table :data="tableCardsKeys" height="450" highlight-current-row
                          @current-change="onCardsSelectedChange">
                    <el-table-column header-align="center" type="index" width="50">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="singleFormatter" label="id">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="cardsNameFormatter" label="name">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="cardsDescFormatter" label="description">
                    </el-table-column>
                </el-table>
                <span slot="footer" class="dialog-footer">
        <el-button @click="dialogCardsVisible = false">取消</el-button>
        <el-button type="primary" @click="addCard">添加</el-button>
      </span>
            </el-dialog>

            <el-dialog :title="inputRelicTitle" v-model="dialogRelicsVisible">
                <el-input v-model="filterRelics" clearable placeholder="过滤遗物 id / name"></el-input>
                <el-table style="margin-top:10px" :data="tableRelicsKeys" height="420"
                          @current-change="onRelicsSelectedChange"
                          highlight-current-row>
                    <el-table-column header-align="center" type="index" width="50">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="singleFormatter" label="id">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="relicsNameFormatter" label="name">
                    </el-table-column>
                    <el-table-column header-align="center" :formatter="relicsDescFormatter" label="description">
                    </el-table-column>
                </el-table>
                <span slot="footer" class="dialog-footer">
        <el-button @click="dialogRelicsVisible = false">取消</el-button>
        <el-button type="primary" @click="addRelic">添加</el-button>
      </span>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import allPotions from './config/potions'
import allRelics from './config/relics'
import allCards from './config/cards'
import {Base64} from 'js-base64'

function foundInMap(map, key, foundAttrGet) {
    const temp = `没有找到${key}`
    if (map[key]) {
        return foundAttrGet(map[key]) || temp
    }
    return temp;
}

export default {
    data() {
        return {
            jsonTxt: '{"name":"VVv","loadout":null,"current_health":60,"max_health":87,"max_orbs":0,"gold":5764,"hand_size":5,"red":5,"green":0,"blue":0,"monsters_killed":20,"elites1_killed":1,"elites2_killed":1,"elites3_killed":1,"gold_gained":252,"mystery_machine":7,"champions":3,"perfect":2,"overkill":true,"combo":false,"cards":[{"upgrades":20,"misc":0,"id":"Searing Blow"},{"upgrades":1,"misc":0,"id":"Barricade"},{"upgrades":1,"misc":0,"id":"Impervious"},{"upgrades":1,"misc":0,"id":"Impervious"},{"upgrades":1,"misc":0,"id":"Impervious"},{"upgrades":1,"misc":0,"id":"Metallicize"},{"upgrades":1,"misc":0,"id":"Rampage"},{"upgrades":0,"misc":0,"id":"Impervious"},{"upgrades":1,"misc":0,"id":"Metallicize"},{"upgrades":1,"misc":0,"id":"Impervious"},{"upgrades":1,"misc":0,"id":"Dark Embrace"},{"upgrades":1,"misc":0,"id":"Mayhem"},{"upgrades":0,"misc":0,"id":"Bloodletting"},{"upgrades":1,"misc":0,"id":"Seeing Red"},{"upgrades":1,"misc":0,"id":"Demon Form"},{"upgrades":1,"misc":0,"id":"Bloodletting"},{"upgrades":1,"misc":0,"id":"Combust"},{"upgrades":0,"misc":0,"id":"Offering"},{"upgrades":1,"misc":0,"id":"Battle Trance"},{"upgrades":1,"misc":0,"id":"Demon Form"},{"upgrades":1,"misc":0,"id":"Demon Form"},{"upgrades":1,"misc":0,"id":"Panache"},{"upgrades":0,"misc":0,"id":"Master of Strategy"},{"upgrades":1,"misc":0,"id":"Flash of Steel"},{"upgrades":1,"misc":0,"id":"Evolve"},{"upgrades":1,"misc":0,"id":"Rupture"}],"obtained_cards":{"Fiend Fire":1,"Perfected Strike":1,"Searing Blow":1,"Barricade":1,"Impervious":3,"Metallicize":2,"Rampage":1,"Dark Embrace":1,"Mayhem":1,"Bloodletting":2,"Seeing Red":1,"Demon Form":3,"Combust":1,"Offering":1,"Battle Trance":1,"Panache":1,"Master of Strategy":1,"Flash of Steel":1,"Evolve":1,"Rupture":1},"relics":["Burning Blood","War Paint","PreservedInsect","Medical Kit","FossilizedHelix","Frozen Egg 2","Bag of Marbles","GremlinMask","Ectoplasm","Self Forming Clay","Kunai","Sling","Anchor","Blood Vial","Black Star","Strawberry","Incense Burner","DollysMirror","Old Coin","Centennial Puzzle","Red Skull","Pantograph","Meat on the Bone","Chemical X","Ice Cream"],"relic_counters":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,-1,-1,-1,-1,-1,-1,-1,-1],"potions":["Strength Potion","LiquidBronze","Fire Potion"],"potion_slots":3,"is_endless_mode":false,"blights":[],"blight_counters":[],"endless_increments":[],"chose_neow_reward":false,"neow_bonus":"ONE_RANDOM_RARE_CARD","neow_cost":"NONE","is_ascension_mode":true,"ascension_level":4,"level_name":"TheBeyond","floor_num":46,"act_num":3,"event_list":["Falling","MindBloom","The Moai Head","Tomb of Lord Red Mask","Winding Halls"],"one_time_event_list":["Accursed Blacksmith","Bonfire Elementals","Designer","Duplicator","Fountain of Cleansing","Knowing Skull","Lab","N\'loth","SecretPortal","The Joust","WeMeetAgain","The Woman in Blue"],"potion_chance":0,"event_chances":[0.3,0.3,0.12,0.08],"monster_list":["Writhing Mass","Transient","Maw","Sphere and 2 Shapes","Jaw Worm Horde","4 Shapes","3 Darklings","Spire Growth","4 Shapes","Sphere and 2 Shapes","Transient"],"elite_monster_list":["Giant Head","Nemesis","Giant Head","Reptomancer","Nemesis","Reptomancer","Giant Head","Reptomancer","Nemesis"],"boss_list":["Donu and Deca","Awakened One","Time Eater"],"play_time":1937,"save_date":0,"seed":3456874837031227899,"special_seed":0,"seed_set":false,"is_daily":false,"is_final_act_on":true,"has_ruby_key":true,"has_emerald_key":true,"has_sapphire_key":true,"daily_date":0,"is_trial":false,"daily_mods":[],"custom_mods":[],"boss":"Donu and Deca","purgeCost":75,"monster_seed_count":101,"event_seed_count":7,"merchant_seed_count":80,"card_seed_count":595,"treasure_seed_count":31,"relic_seed_count":9,"potion_seed_count":107,"ai_seed_count":0,"shuffle_seed_count":0,"card_random_seed_count":0,"card_random_seed_randomizer":0,"path_x":[3,3,2,2,3,2,2,2,1,0,0,0],"path_y":[0,1,2,3,4,5,6,7,8,9,10,11],"room_x":0,"room_y":11,"spirit_count":2,"current_room":"com.megacrit.cardcrawl.rooms.MonsterRoomElite","common_relics":["Boot","Bronze Scales","Orichalcum","Lantern","MawBank","Whetstone","Happy Flower","Regal Pillow","Toy Ornithopter","Nunchaku","Potion Belt","Omamori","Bag of Preparation","Pen Nib","Oddly Smooth Stone","Juzu Bracelet","Ancient Tea Set","MealTicket","Dream Catcher"],"uncommon_relics":["Bottled Tornado","Bottled Lightning","Shuriken","Singing Bowl","Molten Egg 2","Paper Frog","Matryoshka","Darkstone Periapt","Mummified Hand","InkBottle","Eternal Feather","Question Card","Letter Opener","Pear","Ornamental Fan","Mercury Hourglass","Sundial","White Beast Statue","Blue Candle","Bottled Flame","Toxic Egg 2","Gremlin Horn","HornCleat"],"rare_relics":["Gambling Chip","StoneCalendar","Pocketwatch","Unceasing Top","Bird Faced Urn","Shovel","Charon\'s Ashes","Thread and Needle","TungstenRod","Lizard Tail","CaptainsWheel","Champion Belt","Dead Branch","Mango","Peace Pipe","Magic Flower","Girya","Prayer Wheel","Calipers","WingedGreaves","Torii","Ginger"],"shop_relics":["Orrery","Frozen Eye","Membership Card","ClockworkSouvenir","TheAbacus","Brimstone","Lee\'s Waffle","HandDrill","Strange Spoon","Toolbox","OrangePellets","PrismaticShard"],"boss_relics":["Empty Cage","Mark of Pain","Cursed Key","Busted Crown","Black Blood","SacredBark","Coffee Dripper","SlaversCollar","Velvet Choker","Snecko Eye","Fusion Hammer","Astrolabe","Runic Cube","Runic Dome","Runic Pyramid"],"post_combat":false,"mugged":false,"smoked":false,"combat_rewards":null,"bottled_flame":null,"bottled_lightning":null,"bottled_tornado":null,"metric_campfire_rested":0,"metric_campfire_upgraded":5,"metric_campfire_rituals":0,"metric_campfire_meditates":0,"metric_purchased_purges":0,"metric_potions_floor_spawned":[2,4,5,7,22,28,29,30,33,35,37,38],"metric_potions_floor_usage":[],"metric_current_hp_per_floor":[80,80,80,75,80,80,80,80,80,80,78,78,78,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,87,80,77,67,75,75,75,75,65,60],"metric_max_hp_per_floor":[80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,87,87,87,87,87,87,87,87,87,87],"metric_gold_per_floor":[116,127,137,148,161,161,189,8526,8551,8551,8566,7957,7957,7977,7977,8079,8079,8079,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,7177,6513,6513,6513,6513,6513,6513,5764,5764,5764,5764],"metric_path_per_floor":["M","M","M","M","M","R","E","$","T","?","M","$","?","M","R","B","ul","M","$","M","M","M","R","E","M","T","R","M","M","M","M","R","B",null,"M","$","M","?","?","E","R","$","T","M","M"],"metric_path_taken":["M","?","M","M","M","R","E","$","T","?","M","$","?","M","R","BOSS","M","$","M","M","M","R","E","M","T","R","M","M","?","M","R","BOSS","M","$","?","?","?","E","R","$","T","M","M","E"],"metric_items_purchased":["PreservedInsect","Medical Kit","FossilizedHelix","Metallicize","Impervious","Frozen Egg 2","Bag of Marbles","Metallicize+1","Self Forming Clay","Kunai","Sling","Dark Embrace+1","Mayhem+1","Strawberry","Incense Burner","DollysMirror","Demon Form+1","Pantograph","Meat on the Bone","Chemical X","Evolve+1"],"metric_item_purchase_floors":[8,8,8,8,12,12,12,12,19,19,19,19,19,36,36,36,36,42,42,42,42],"metric_items_purged":[],"metric_items_purged_floors":[],"metric_card_choices":[{"picked":"Perfected Strike","not_picked":["Shrug It Off","Heavy Blade"],"floor":1},{"picked":"Searing Blow","not_picked":["Anger","Fire Breathing"],"floor":2},{"picked":"Barricade","not_picked":["Reckless Charge","Burning Pact"],"floor":3},{"picked":"SKIP","not_picked":["Rampage","Warcry","Searing Blow"],"floor":4},{"picked":"SKIP","not_picked":["Spot Weakness","Iron Wave","Shrug It Off"],"floor":5},{"picked":"Impervious","not_picked":["Inflame","Headbutt"],"floor":7},{"picked":"Rampage","not_picked":["Clash","Headbutt"],"floor":11},{"picked":"SKIP","not_picked":["Iron Wave","Warcry","Perfected Strike"],"floor":14},{"picked":"SKIP","not_picked":["Iron Wave","Warcry","Perfected Strike"],"floor":14},{"picked":"Impervious","not_picked":["Bludgeon","Double Tap"],"floor":16},{"picked":"SKIP","not_picked":["Cleave","Anger+1","Perfected Strike"],"floor":18},{"picked":"Bloodletting","not_picked":["Inflame+1","Wild Strike"],"floor":20},{"picked":"SKIP","not_picked":["Intimidate","Flex","Pommel Strike"],"floor":21},{"picked":"Seeing Red","not_picked":["Dropkick","Hemokinesis"],"floor":22},{"picked":"Demon Form+1","not_picked":["Iron Wave","Perfected Strike"],"floor":24},{"picked":"Bloodletting+1","not_picked":["Intimidate+1","Second Wind"],"floor":25},{"picked":"SKIP","not_picked":["Wild Strike","Anger","Headbutt"],"floor":28},{"picked":"SKIP","not_picked":["Perfected Strike","Iron Wave","Uppercut"],"floor":29},{"picked":"Combust+1","not_picked":["Iron Wave+1","Corruption+1"],"floor":30},{"picked":"SKIP","not_picked":["True Grit+1","Second Wind","Wild Strike"],"floor":31},{"picked":"Offering","not_picked":["Barricade+1","Immolate"],"floor":33},{"picked":"Battle Trance+1","not_picked":["Cleave+1","Metallicize+1"],"floor":35},{"picked":"SKIP","not_picked":["Twin Strike+1","Shrug It Off+1","Inflame+1"],"floor":37},{"picked":"Panache+1","not_picked":["Dramatic Entrance","PanicButton"],"floor":39},{"picked":"Master of Strategy","not_picked":["Good Instincts","Trip"],"floor":39},{"picked":"Flash of Steel","not_picked":["HandOfGreed","Swift Strike"],"floor":39},{"picked":"SKIP","not_picked":["Corruption+1","Reckless Charge+1","Armaments+1"],"floor":40},{"picked":"SKIP","not_picked":["Clothesline","Warcry","Shockwave+1"],"floor":44},{"picked":"Rupture+1","not_picked":["Twin Strike+1","Iron Wave+1"],"floor":45}],"metric_event_choices":[{"event_name":"The Cleric","player_choice":"Leave","floor":10,"cards_obtained":null,"cards_removed":null,"cards_transformed":null,"cards_upgraded":null,"relics_obtained":null,"potions_obtained":null,"relics_lost":null,"damage_taken":0,"damage_healed":0,"max_hp_loss":0,"max_hp_gain":0,"gold_gain":0,"gold_loss":0},{"event_name":"FaceTrader","player_choice":"Trade","floor":13,"cards_obtained":null,"cards_removed":null,"cards_transformed":null,"cards_upgraded":null,"relics_obtained":["GremlinMask"],"potions_obtained":null,"relics_lost":null,"damage_taken":0,"damage_healed":0,"max_hp_loss":0,"max_hp_gain":0,"gold_gain":0,"gold_loss":0},{"event_name":"Mysterious Sphere","player_choice":"Fight","floor":38,"cards_obtained":null,"cards_removed":null,"cards_transformed":null,"cards_upgraded":null,"relics_obtained":null,"potions_obtained":null,"relics_lost":null,"damage_taken":0,"damage_healed":0,"max_hp_loss":0,"max_hp_gain":0,"gold_gain":0,"gold_loss":0},{"event_name":"SensoryStone","player_choice":"Memory 3","floor":39,"cards_obtained":null,"cards_removed":null,"cards_transformed":null,"cards_upgraded":null,"relics_obtained":null,"potions_obtained":null,"relics_lost":null,"damage_taken":10,"damage_healed":0,"max_hp_loss":0,"max_hp_gain":0,"gold_gain":0,"gold_loss":0}],"metric_boss_relics":[{"picked":"Ectoplasm","not_picked":["Tiny House","Philosopher\'s Stone"]},{"picked":"Black Star","not_picked":["Calling Bell","Sozu"]}],"metric_damage_taken":[{"floor":1,"enemies":"Cultist","damage":0,"turns":3},{"floor":2,"enemies":"2 Louse","damage":0,"turns":2},{"floor":3,"enemies":"Small Slimes","damage":1,"turns":2},{"floor":4,"enemies":"2 Fungi Beasts","damage":11,"turns":3},{"floor":5,"enemies":"Large Slime","damage":0,"turns":1},{"floor":7,"enemies":"Lagavulin","damage":0,"turns":1},{"floor":11,"enemies":"3 Louse","damage":8,"turns":6},{"floor":14,"enemies":"Blue Slaver","damage":0,"turns":3},{"floor":16,"enemies":"Slime Boss","damage":0,"turns":1},{"floor":18,"enemies":"3 Byrds","damage":0,"turns":5},{"floor":20,"enemies":"Shell Parasite","damage":0,"turns":3},{"floor":21,"enemies":"Centurion and Healer","damage":0,"turns":4},{"floor":22,"enemies":"Shelled Parasite and Fungi","damage":0,"turns":3},{"floor":24,"enemies":"Gremlin Leader","damage":6,"turns":3},{"floor":25,"enemies":"3 Cultists","damage":0,"turns":5},{"floor":28,"enemies":"Centurion and Healer","damage":0,"turns":4},{"floor":29,"enemies":"Shelled Parasite and Fungi","damage":0,"turns":3},{"floor":30,"enemies":"Snake Plant","damage":0,"turns":2},{"floor":31,"enemies":"Snecko","damage":0,"turns":2},{"floor":33,"enemies":"Collector","damage":5,"turns":4},{"floor":35,"enemies":"Orb Walker","damage":0,"turns":1},{"floor":37,"enemies":"3 Darklings","damage":13,"turns":5},{"floor":38,"enemies":"2 Orb Walkers","damage":11,"turns":4},{"floor":40,"enemies":"Reptomancer","damage":0,"turns":1},{"floor":44,"enemies":"Jaw Worm Horde","damage":18,"turns":4},{"floor":45,"enemies":"4 Shapes","damage":25,"turns":3}],"metric_potions_obtained":[{"key":"ElixirPotion","floor":2},{"key":"FearPotion","floor":4},{"key":"EssenceOfSteel","floor":5},{"key":"Strength Potion","floor":22},{"key":"LiquidBronze","floor":28},{"key":"Fire Potion","floor":29}],"metric_relics_obtained":[{"key":"War Paint","floor":7},{"key":"Anchor","floor":24},{"key":"Blood Vial","floor":26},{"key":"Old Coin","floor":38},{"key":"Centennial Puzzle","floor":40},{"key":"Red Skull","floor":40},{"key":"Ice Cream","floor":43}],"metric_campfire_choices":[{"floor":6,"key":"RECALL"},{"floor":15,"key":"SMITH","data":"Metallicize"},{"floor":23,"key":"SMITH","data":"Seeing Red"},{"floor":27,"key":"SMITH","data":"Rampage"},{"floor":32,"key":"SMITH","data":"Impervious"},{"floor":41,"key":"SMITH","data":"Flash of Steel"}],"metric_build_version":"2020-01-27","metric_seed_played":"3456874837031227899","metric_floor_reached":46,"metric_playtime":1937}',
            isInit: false,
            jsonObj: {},
            selectedCards: [],
            selectedRelics: [],
            inputCard: '',
            inputCardTitle: '选择卡片',
            inputRelic: '',
            inputRelicTitle: '选择遗物',
            // output: '',
            dialogRelicsVisible: false,
            dialogCardsVisible: false,
            allTableCards: allCards,
            allTableRelics: allRelics,
            filterRelics: '',
            filterCards: '',
        }
    },
    methods: {
      getUploadFile(file) {
        let fileReader = new FileReader()
        fileReader.readAsText(file)
        fileReader.onload = e => this.decodeData(fileReader.result)
        return false
      },
      decodeData(text) {
        let key = ['k', 'e', 'y']
        let result = Base64.decode(text)
            .split('')
            .map(c => c.charCodeAt(0))
        for (let i = 0; i < result.length; i++) {
          result[i] = result[i] ^ key[i % key.length].charCodeAt(0)
        }
        let json = JSON.parse(String.fromCharCode(...result))
        this.jsonTxt=String.fromCharCode(...result)
      },
        parsing() {
            try {
                let json = JSON.parse(this.jsonTxt)
                this.isInit = true
                this.jsonObj = json
            } catch (e) {

            }
        },

        singleFormatter: row => row,
        relicsNameFormatter: row => {
            return foundInMap(allRelics, row, (data) => data.NAME)
        },
        relicsDescFormatter: row => foundInMap(allRelics, row, (data) => data.DESCRIPTIONS).join(),
        cardsNameFormatter: row => foundInMap(allCards, row, (data) => data.NAME),
        cardsNameObjectFormatter: row => {
            return foundInMap(allCards, row.id, (data) => data.NAME)
        },
        cardsDescFormatter: row => foundInMap(allCards, row, (data) => data.DESCRIPTION),
        potionNameFormatter: row => {
            return foundInMap(allPotions, row, (data) => data.NAME)
        },
        onCardsSelectionChange(data) {
            this.selectedCards = data
        },
        onRelicsSelectionChange(data) {
            this.selectedRelics = data
        },
        deleteSelectedCards() {
            this.selectedCards.forEach(item => {
                for (let i = this.jsonObj.cards.length - 1; i >= 0; i--) {
                    if (item === this.jsonObj.cards[i]) {
                        this.jsonObj.cards.splice(i, 1)
                    }
                }
            })
        },
        upgradeSelectedCards() {
            this.selectedCards.forEach(item => {
                for (let i = this.jsonObj.cards.length - 1; i >= 0; i--) {
                    if (item === this.jsonObj.cards[i]) {
                        this.jsonObj.cards[i].upgrades = 1
                    }
                }
            })
            this.$refs.cardsTable.clearSelection()
        },
        deleteSelectedRelics() {
            this.selectedRelics.forEach(item => {
                for (let i = this.jsonObj.relics.length - 1; i >= 0; i--) {
                    if (item === this.jsonObj.relics[i]) {
                        this.jsonObj.relics.splice(i, 1)
                    }
                }
            })
        },
        onRelicsSelectedChange(row) {
            this.inputRelic = row
        },
        onCardsSelectedChange(row) {
            this.inputCard = row
        },
        addCard() {
            if (!this.inputCard || !this.inputCard.trim()) {
                this.$message({
                    message: '请选择卡片',
                    type: 'warning'
                })
                return
            }
            let value = this.inputCard.trim()
            this.jsonObj.cards.push({
                id: value,
                upgrades: 0
            })
            this.$message({
                message: '添加成功',
                type: 'success'
            })
        },
        addRelic() {
            if (!this.inputRelic || !this.inputRelic.trim()) {
                this.$message({
                    message: '请选择遗物',
                    type: 'warning'
                })
                return
            }
            let value = this.inputRelic.trim()
            if (this.jsonObj.relics.includes(value)) {
                this.$message({
                    message: '已经添加过该遗物',
                    type: 'error'
                })
                return
            }
            this.jsonObj.relics.push(value)
            this.$message({
                message: '添加成功',
                type: 'success'
            })
        },
        exportFile() {
            let jsonString = JSON.stringify(this.jsonObj)
            this.jsonTxt = jsonString
            let key = ['k', 'e', 'y']
            let chars = jsonString.split('').map(c => c.charCodeAt(0))
            for (let i = 0; i < chars.length; i++) {
              chars[i] = chars[i] ^ key[i % key.length].charCodeAt(0)
            }
            this.$message({
              message: '生成存档编码成功',
              type: 'success'
            })
          this.$clipboard(Base64.encode(String.fromCharCode(...chars))).then(()=>{
            this.$message({
              message: '存档编码已复制到剪贴板',
              type: 'success'
            })
          }).catch(()=>{
            this.$message({
              message: '复制失败',
              type: 'danger'
            })
          })
        },
        copyData(){
          this.$clipboard(this.output).then(()=>{
            this.$message({
              message: '已复制到剪贴板',
              type: 'success'
            })
          }).catch(()=>{
            this.$message({
              message: '复制失败',
              type: 'danger'
            })
          })
        },
    },
    computed: {
        dropAllPotions() {
            let out = []
            for (let key in allPotions) {
                out.push(key)
            }
            return out
        },
        tableRelicsKeys() {
            let out = []
            for (let key in this.allTableRelics) {
                out.push(key)
            }
            out.sort()
            return out
        },
        tableCardsKeys() {
            let out = []
            for (let key in this.allTableCards) {
                out.push(key)
            }
            out.sort()
            return out
        },
    },
    mounted() {

    },
    watch: {
        inputRelic(curVal, oldVal) {
            this.inputRelicTitle =
                '选择遗物\u3000( ' + curVal + ' - ' + allRelics[curVal].NAME + ' )'
        },
        inputCard(curVal, oldVal) {
            this.inputCardTitle =
                '选择卡片\u3000( ' + curVal + ' - ' + allCards[curVal].NAME + ' )'
        },
        filterCards(curVal, oldVal) {
            let value = curVal.trim()
            if (!value) {
                this.allTableCards = allCards
                return
            }
            let keys = []
            let hasAdd = false
            for (let key in allCards) {
                const cardInfo = allCards[key];
                // id匹配
                if (key.toLowerCase().includes(value.toLowerCase()) ||
                    cardInfo.NAME.toLowerCase().includes(value.toLowerCase()) ||
                    cardInfo.DESCRIPTION.toLowerCase().includes(value.toLowerCase())
                ) {
                    keys.push(key)
                    hasAdd = true
                }
            }
            let result = {}
            keys.forEach(item => (result[item] = allCards[item]))
            this.allTableCards = result
        },
        filterRelics(curVal, oldVal) {
            let value = curVal.trim()
            if (!value) {
                this.allTableRelics = allRelics
                return
            }
            let keys = []
            let hasAdd = false
            for (let key in allRelics) {
                if (key.toLowerCase().includes(value.toLowerCase()) ||
                    allRelics.NAME.toLowerCase().includes(value.toLowerCase()) ||
                    allRelics.DESCRIPTIONS.toLowerCase().includes(value.toLowerCase())) {
                    keys.push(key)
                    hasAdd = true
                }
            }
            let result = {}
            keys.forEach(item => (result[item] = allRelics[item]))
            this.allTableRelics = result
        }
    }
}
</script>

<style scoped>
.title-text {
    font-size: 16px;
}

.match {
    height: 100%;
}

.input {
    width: 180px;
}

.role {
    display: flex;
    align-items: center;
    justify-content: space-around;
}

.flex-row {
    display: flex;
    flex-direction: row;
}
</style>
