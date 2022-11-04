from pyteal import *


class Gadget:
    class Variables:
        name = Bytes("NAME")
        image = Bytes("IMAGE")
        description = Bytes("DESCRIPTION")
        price = Bytes("PRICE")
        archived = Bytes("ARCHIVED") #an extra byte that to archive and unarchive a gadget
        sold = Bytes("SOLD") 

    
    # updated here
    class AppMethods:
        buy = Bytes("buy")
        update = Bytes('update') # an  Appmethod that updates a gadget 
        archive = Bytes('archive') # an Appmethode that archives a gadget
        unarchive = Bytes('unarchive') # an Appmethode that unarchives a gadget


    #new update method
    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(4)),
            Assert(Btoi(Txn.application_args[3]) > Int(0)),
            App.globalPut(self.Variables.name, Txn.application_args[0]),
            App.globalPut(self.Variables.image, Txn.application_args[1]),
            App.globalPut(self.Variables.description, Txn.application_args[2]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[3])),
            App.globalPut(self.Variables.sold, Int(0)),
            App.globalPut(self.Variables.archived, Int(0)), #setting the archived value
            Approve()
        ])

    #update method to update created gadgets by Dapp_owner apps created when users buy gadgets have no access 
    def update(self):
        is_owner = Txn.sender() == Global.creator_address()

        validate = And(
            Txn.application_args.length() == Int(5),
            Txn.note() == Bytes("next-softtech:nxt5"),
            Btoi(Txn.application_args[4]) > Int(0),
        )

        checker = And(is_owner, validate)

        update_app = Seq([
            App.globalPut(self.Variables.name, Txn.application_args[1]),
            App.globalPut(self.Variables.image, Txn.application_args[2]),
            App.globalPut(self.Variables.description, Txn.application_args[3]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[4])),
            App.globalPut(self.Variables.sold, App.globalGet(self.Variables.sold)),
            Approve()
        ])


        return If(checker).Then(update_app).Else(Reject())
        
        
    #archive method to archive created gadgets by Dapp_owner apps created when users buy gadgets have no access
    def archive(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(1)),
            Assert(Txn.note() == Bytes("next-softtech:nxt5")),
            App.globalPut(self.Variables.archived, Int(1)), 
            Approve()
        ])

    #unarchive method to unarchive created gadgets by Dapp_owner apps created when users buy gadgets have no access
    def unarchive(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(1)),
            Assert(Txn.note() == Bytes("next-softtech:nxt5")),
            App.globalPut(self.Variables.archived, Int(0)), 
            Approve()
        ])         
 

    def buy(self):
        count = Txn.application_args[1]
        valid_number_of_transactions = Global.group_size() == Int(2)


        valid_payment_to_seller = And(
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].receiver() == Global.creator_address(),
            Gtxn[1].amount() == App.globalGet(self.Variables.price) * Btoi(count),
            Gtxn[1].sender() == Gtxn[0].sender(),
        )

        can_buy = And(valid_number_of_transactions,
                      valid_payment_to_seller)

        update_state = Seq([
            App.globalPut(self.Variables.sold, App.globalGet(self.Variables.sold) + Btoi(count)),
            Approve()
        ])
           

        return If(can_buy).Then(update_state).Else(Reject())

    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    # updated here
    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.buy, self.buy()],
            [Txn.application_args[0] == self.AppMethods.update, self.update()],
            [Txn.application_args[0] == self.AppMethods.archive, self.archive()],
            [Txn.application_args[0] == self.AppMethods.unarchive, self.unarchive()]
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))