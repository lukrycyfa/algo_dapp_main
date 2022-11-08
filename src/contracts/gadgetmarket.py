from pyteal import *


class Gadget:
    class Variables:
        name = Bytes("NAME")
        image = Bytes("IMAGE")
        description = Bytes("DESCRIPTION")
        price = Bytes("PRICE")
        archived = Bytes("ARCHIVED") #an extra byte that to archive and unarchive a gadget
        sold = Bytes("SOLD") 

    
    # Application methods
    class AppMethods:
        buy = Bytes("buy")
        update = Bytes('update') # an  Appmethod that updates a gadget 
        archive = Bytes('archive') # an Appmethode that archives a gadget
        unarchive = Bytes('unarchive') # an Appmethode that unarchives a gadget


    #Application creation method
    def application_creation(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(4)), # assert txn application args length == 4.
            # checks to ensure that input data contains only valid values
            Assert(
                And(
                    Len(Txn.application_args[0]) > Int(0),
                    Len(Txn.application_args[1]) > Int(0),
                    Len(Txn.application_args[2]) > Int(0),
                    Btoi(Txn.application_args[3]) > Int(0)
                ),
                Txn.note() == Bytes("next-softtech:nxt5"),
            ),
            
            # Update the global state of newly created  application with  txn  application args. 
            App.globalPut(self.Variables.name, Txn.application_args[0]),
            App.globalPut(self.Variables.image, Txn.application_args[1]),
            App.globalPut(self.Variables.description, Txn.application_args[2]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[3])),
            App.globalPut(self.Variables.sold, Int(0)),
            App.globalPut(self.Variables.archived, Int(0)),
            Approve()
        ])

    #update method to update created gadgets. apps created when users buy gadgets have no access to this method 
    def update(self):
        is_owner = Txn.sender() == Global.creator_address() # validates the Txn sender is the app creator.

        validate = And(
            Txn.application_args.length() == Int(5), # assert txn  application args length == 5.
            Btoi(Txn.application_args[4]) > Int(0), # assert txn  application args(price) > 0.
        )

        checker = And(is_owner, validate) # the above variables passed for validation.
        
        # Update the global state of the requested application with transaction application args.
        update_app = Seq([
            App.globalPut(self.Variables.name, Txn.application_args[1]),
            App.globalPut(self.Variables.image, Txn.application_args[2]),
            App.globalPut(self.Variables.description, Txn.application_args[3]),
            App.globalPut(self.Variables.price, Btoi(Txn.application_args[4])),
            Approve()
        ])

        # If the checker is valid then update.
        return If(checker).Then(update_app).Else(Reject())
        
        
    #archive method to archive created gadgets by app owner. apps created when users buy gadgets have no access to this method
    def archive(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(1)), # assert txn  application args length == 1.
            Assert(Txn.sender() == Global.creator_address()),
            Assert(App.globalGet(self.Variables.archived) == Int(0)),
            App.globalPut(self.Variables.archived, Int(1)), # set the archived value of requested app to 1.
            Approve()
        ])

    #unarchive method to unarchive created gadgets by app owner. apps created when users buy gadgets have no access to this method
    def unarchive(self):
        return Seq([
            Assert(Txn.application_args.length() == Int(1)), # assert txn  application args length == 1.
            Assert(Txn.sender() == Global.creator_address()),
            Assert(App.globalGet(self.Variables.archived) == Int(1)),
            App.globalPut(self.Variables.archived, Int(0)), # set the archived value of requested app to 0.
            Approve()
        ])         
 
    # Buy Application method
    def buy(self):
        count = Txn.application_args[1] # Txn app_arg specifiying number of items to be bought.
        valid_number_of_transactions = Global.group_size() == Int(2) # validates number of Txn == 2


        valid_payment_to_seller = And(
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].amount() == App.globalGet(self.Variables.price) * Btoi(count),
            Gtxn[1].receiver() == Global.creator_address(),
            Gtxn[0].sender() != Global.creator_address(), 
            Gtxn[1].sender() == Gtxn[0].sender(),
        )

        can_buy = And(App.globalGet(self.Variables.archived) == Int(0),valid_number_of_transactions,
                      valid_payment_to_seller) # the above objects passed for validation.

        update_state = Seq([
            # Update the sold variable global state for requested application
            App.globalPut(self.Variables.sold, App.globalGet(self.Variables.sold) + Btoi(count)),
            Approve()
        ])
           
        # If the can_buy is valid then update.
        return If(can_buy).Then(update_state).Else(Reject())

    # Application delete method
    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    # Appication start method
    def application_start(self):
        #A list of conditons checked when application start is called
        #with certain conditions that decides which Appmethods to call. 
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()], 
            [Txn.on_completion() == OnComplete.DeleteApplication, self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.buy, self.buy()], 
            [Txn.application_args[0] == self.AppMethods.update, self.update()],
            [Txn.application_args[0] == self.AppMethods.archive, self.archive()],
            [Txn.application_args[0] == self.AppMethods.unarchive, self.unarchive()]
        )

    # Application approval method         
    def approval_program(self):
        return self.application_start()

    # Application clear method           
    def clear_program(self):
        return Return(Int(1))
